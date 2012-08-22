`// ************************************************************************************************
//
// Raphaël.js Polygon Intersection
// by Brandon Evans, 2012
// brandonevans.ca
// @interstateone
//
// Based on Efficient Clipping of Arbitrary Polygons by Gunther Greiner and Kai Hormann
// http://davis.wpi.edu/~matt/courses/clipping/
//
// ************************************************************************************************`

root = exports ? window

# Node object
# Used for each vertex of a polygon and the intersects

root.Node = class Node
  constructor: (@x, @y, @intersect = false) ->
    @entry = false
    @visited = false

  # Is this node on a given line segment?
  # Returns: true / false
  onLine: (n0, n1) ->

    # Get vectors for the line segment and from this node to n0
    # Ratio of dot prodcuts gives the projection of one onto the other
    v0 = new Node n1.x - n0.x, n1.y - n0.y
    vthis = new Node @x - n0.x, @y - n0.y
    denom = v0.x * v0.x + v0.y * v0.y

    # First line segment has zero length, are these equal points?
    if denom is 0.0
      return @x is n0.x and @y is n0.y
    else
      ratio = (v0.x * @x + v0.y * @y ) / denom
      return ratio >= 0.0 and ratio <= 1.0

  toString: -> "#{ @x },#{ @y }"

Array::nextFromIndex = (i) ->
  return @[ if i + 1 is @length then 0 else i + 1 ]
Array::prevFromIndex = (i) ->
  return @[ if i - 1 is -1 then @length - 1 else i - 1 ]
Array::nextFrom = (node) ->
  aux = @[i = 0]
  until aux.x is node.x and aux.y is node.y
    i++
    aux = @[i]
  return @nextFromIndex i
Array::prevFrom = (node) ->
  aux = @[i = 0]
  until aux.x is node.x and aux.y is node.y
    i++
    aux = @[i]
  return @prevFromIndex i

root.NodeArray = NodeArray = Array

# Finds if two line segments intersect
# Takes two pairs of nodes
# Returns: the intersect node or false
# http://stackoverflow.com/a/1968345/1082395
root.doesIntersect = doesIntersect = (n0, n1, n2, n3) ->

  denom = (n3.y - n2.y) * (n1.x - n0.x) - (n3.x - n2.x) * (n1.y - n0.y)

  return false if denom is 0

  ua = ((n3.x - n2.x) * (n0.y - n2.y) - (n3.y - n2.y) * (n0.x - n2.x)) / denom
  ub = ((n1.x - n0.x) * (n0.y - n2.y) - (n1.y - n0.y) * (n0.x - n2.x)) / denom
  x = n0.x + ua * (n1.x - n0.x)
  y = n0.y + ua * (n1.y - n0.y)
  result = new Node x, y, true

  if 0 <= ua <= 1 and 0 <= ub <= 1 then result else false

# Returns the norm (length) of a line vector
root.norm = norm = (n0, n1) ->
  Math.sqrt (n1.x - n0.x) * (n1.x - n0.x) + (n1.y - n0.y) * (n1.y - n0.y)

# Function that uses the even/odd rule to determine if a point is inside of a polygon
# Takes a node object and node array representing a polygon
# Creates a line vector from the node parameter (x, y) to (0, y)
# Checks how many times it intersects with each polygon line segment
# Returns mod 2 of the intersection count: even is external node, odd is internal node
root.containmentTest = containmentTest = (n0, poly) ->
  left = new Node 0, n0.y
  type = 0

  for node, i in poly
    next = poly[if i < poly.length - 1 then i + 1 else 0]
    type++ if doesIntersect left, n0, node, next

  return !!(type % 2)

root.markIntersects = markIntersects = (subject, clip) ->
  for subjectNode, subjectIndex in subject
    unless subjectNode.intersect
      for clipNode, clipIndex in clip
        unless clipNode.intersect

          # We need to find the next non-intersect node as well
          # Because we're working with arrays, we need to be sure that we stick within the bounds and wrap around the end
          # That's what this dumb hunk of code is doing

          # Initial next value inside bounds
          i = if subjectIndex + 1 is subject.length then -subjectIndex else 1

          # Increment and wrap around
          while subject[subjectIndex + i].intersect
            i++
            if subjectIndex + i is subject.length then i = -subjectIndex

          # Same steps here for the clip
          j = if clipIndex + 1 is clip.length then -clipIndex else 1

          while clip[clipIndex + j].intersect
            j++
            if clipIndex + j is clip.length then j = -clipIndex

          result = doesIntersect subject[subjectIndex], subject[subjectIndex + i], clip[clipIndex], clip[clipIndex + j]

          if result
            subjectResult = new Node(result.x, result.y, true)
            clipResult = new Node(result.x, result.y, true)
            subjectResult.neighbour = clipResult
            clipResult.neighbour = subjectResult
            subject.splice subjectIndex + 1, 0, subjectResult
            clip.splice clipIndex + 1, 0, clipResult

# First determines the inside/outside value for one vertex of the subject polygon with containmentTest()
# If it is outside the other polygon then the next intersection point will be marked as entry in clip
# It it's inside then the next intersect will be an exit (false)
root.markEntryPoints = markEntryPoints = (subject, clip, flag = false) ->
  e = containmentTest subject[0], clip

  # // I think this has to do with the other possible boolean operations (http://davis.wpi.edu/~matt/courses/clipping/#two)
  e = not e if flag

  # Once we found the entry/exit state of that first intersect we just alternate states for the successive intersect nodes
  for node in clip
    if node.intersect
      node.entry = e
      e = not e

# Utility clipping function
# Takes two path element objects representing subject and clip polygons
# Returns the resultant clipped polygons as a Raphael.js element object
Raphael.fn.clip = (subject, clip) ->

  # Convert the two Raphael paths to Node arrays
  subject = subject.toNodes()
  clip = clip.toNodes()

  # Loop through all of the line segments and find intersects
  markIntersects subject, clip

  # Mark entry points for both polygons
  markEntryPoints subject, clip
  markEntryPoints clip, subject

  # Build the clipped polygon
  # Traverse the subject node list until you get to an entry/exit node, switch to clip node list
  # Traverse the clip node list until you get to an entry/exit node, switch to subject node list
  # Stop when you reach the first visited entry/exit node
  # The variable 'aux' represents the current node we're at

  current = subject
  currentNode = current[0]
  newPolygon = []
  forward = true

  # Start at the first subject entry vertex
  currentNode = current.nextFrom currentNode until currentNode.entry is true
  currentNode.visited = true

  # Traverse until we hit the first vertex we pushed
  loop
    newPolygon.push currentNode

    if currentNode.intersect
      currentNode = currentNode.neighbour
      current = if current is subject then clip else subject
      forward = currentNode.entry

    if forward then currentNode = current.nextFrom currentNode
    else currentNode = current.prevFrom currentNode

    currentNode.visited = true
    break if currentNode is newPolygon[0]

  paper.path "M#{ newPolygon.join 'L' }Z"

# Utility join function
# Takes two path element objects
# Returns the joined path object
# The only difference between this and the clip function is the starting entry/exit status of the mark function
Raphael.fn.join = (subject, clip) ->

# Clip the elements of a set
# Returns a new set containing the new polygons or false if none (no overlap)
Raphael.st.clip = ->
  subjectIndex = 0
  clipIndex = 1

  # Get the node arrays for this pair
  subjectNodes = @[subjectIndex].toNodes()
  clipNodes = @[clipIndex].toNodes()

  # Clip the two polygons
  # Returns a node array of the clipped array or false if no overlap
  result = paper.clip subjectNodes, clipNodes

  # If we need to find the intersect of more than two polygons, let's loop it
  if @length > 2
    for polygon in @.splice 0, 2
      # Get the node array for the new polygon
      clipNodes = polygon.toNodes()
      # Format the result from before so we can clip it again (this could probably be "optimized" (read: fixed))
      result = paper.path("M#{ result.join 'L' }Z").toNodes()
      # Clip it!
      result = paper.clip result, clipNodes

  # If there's a resultant clipped polygon, push it out formatted properly
  if result then resultPath = paper.path "M#{ result.join 'L' }Z" else false

Raphael.st.join = ->

# Takes the element's path string and converts it to an array of node objects
# Ensures that they are in a clockwise order
Raphael.el.toNodes = ->
  # pathStringArray is in the form [[SVG instruction, x, y], ...]
  return false if @attr('path') is ''
  pathStringArray = Raphael.parsePathString @attr 'path'
  nodeArray = new NodeArray

  for vertex in pathStringArray
    nodeArray.push new Node vertex[1], vertex[2] if vertex[0] isnt 'Z'

  # Use the sum of the edges to determine the direction
  # http://stackoverflow.com/a/1165943/1082395
  sum = 0
  for node in nodeArray
    nextNode = nodeArray.nextFrom node
    sum += (nextNode.x - node.x) * (nextNode.y + node.y)

  # If it's CCW, reverse it
  nodeArray.reverse() if sum > 0

  return nodeArray