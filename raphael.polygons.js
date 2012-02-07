// ************************************************************************************************
// 
// Raphaël.js Polygon Intersection
// by Brandon Evans, 2012
// brandonevans.ca
// @interstateone
// 
// Based on Efficient Clipping of Arbitrary Polygons by Gunther Greiner and Kai Hormann
// http://davis.wpi.edu/~matt/courses/clipping/
// 
// Gives the ability to find the intersection of two or more polygons as a new polygon.
// They can be concave or convex, but self-intersecting may not work properly.
// Uses "node" objects to represent vertices of polygons and their intersection points.
// 
// Utility Functions:
// 	- doesIntersect
// 		Takes two pairs of node objects representing line segments: no ------- n1, n2 ------- n3
// 		If they intersect a node is returned, if they don't intersect then "false" is returned
// 
// 	- norm
// 		Takes one pair of node objects representing one line segment
// 		Returns the norm/length/magnitude of the line
// 
// 	- clipIntersect
// 		Needs to be deprecated, not really needed
// 
// 	- containmentTest
// 		Uses the even/odd rule to determine whether a point is inside another polygon
// 		Used by markEntryPoints in order to determine whether an intersection point is an entry or exit
// 		Takes a single node and a node array representing a polygon
// 		Returns 0 for an outside point or 1 for an inside point
// 
// 	- markEntryPoints
// 		Marks the intersection points in one polygon as being entry or exits for the edges of the other polygon
// 		Uses containmentTest to determine the initial status, then alternates entry/exit
// 		Takes two node arrays to compare, and a flag setting
// 		Returns the updated node array with entry/exit statuses
// 
// 	- Raphael.el.toNodes
// 		Function that converts an element's path to the node array that's needed for clipping
// 		Also makes sure that the nodes are in CW order
// 		Returns a node array in CW order
// 
// The Good Stuff:
// 	- Raphael.fn.clip
// 		The general clipping function
// 		Takes two node arrays representing subject and clip, but the order is not important
// 		Returns the node array of the intersection or false if there isn't an intersection
// 
// 	- Raphael.st.clip
// 		Takes advantage of the general clip function with sets
// 		Useful if there are more than two polygons you need to clip, this will find the total intersection
// 
// ************************************************************************************************

// Node object
// Used for each vertex of a polygon and the intersects
function node (x, y, intersect, alpha) {
	this.x = x;
	this.y = y;

	this.intersect = intersect;
	this.alpha = alpha;
	this.entry = false;
	this.visited = false;

	// Is this node on a given line segment?
	// Returns: true / false
	this.onLine = function(n0, n1) {
		
		// Get vectors for the line segment and from this node to n0
		// Ratio of dot prodcuts gives the projection of one onto the other

		var v0    = new node(n1.x - n0.x, n1.y - n0.y),
			vthis = new node(this.x - n0.x, this.y - n0.y),
			ratio,
			denom = v0.x * v0.x + v0.y * v0.y;
		
		// First line segment has zero length, are these equal points?
		if (denom == 0.0) {
			return (this.x == n0.x && this.y == n0.y);
		} else {
			ratio = (v0.x * vthis.x + v0.y * vthis.y ) / denom;
			return ((ratio >= 0.0) && (ratio <= 1.0));
		}
	}

	this.toString = function() {
		return this.x + "," + this.y;
	}
}

// Finds if two line segments intersect
// Takes two pairs of nodes
// Returns: the intersect node or false
// http://stackoverflow.com/a/1968345/1082395
doesIntersect = function (n0, n1, n2, n3) {

	var denom = (n3.y - n2.y) * (n1.x - n0.x) - (n3.x - n2.x) * (n1.y - n0.y);

    // Parallel
    if (denom === 0) {
    	return false;
    }

    var ua = ((n3.x - n2.x) * (n0.y - n2.y) - (n3.y - n2.y) * (n0.x - n2.x)) / denom,
    	ub = ((n1.x - n0.x) * (n0.y - n2.y) - (n1.y - n0.y) * (n0.x - n2.x)) / denom,
    	x = n0.x + ua * (n1.x - n0.x),
    	y = n0.y + ua * (n1.y - n0.y),
    	result = new node(x, y, true, 0);

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        // Collision detected
        return result;
    } else {
		// No collision
		return false; 	
    }
}

// Returns the norm (length) of a line vector
norm = function(n0, n1) {
	return Math.sqrt(((n1.x - n0.x) * (n1.x - n0.x)) + ((n1.y - n0.y) * (n1.y - n0.y)));
}

// Line intersect function specifically for clipping polygons
// Takes two line segments of node objects L1(n0, n1), L2(n2, n3)
// Returns the point and alpha values as an object if they intersect, otherwise false
clipIntersect = function (n0, n1, n2, n3) {
	var alphaS,
		alphaC,
		result;

	// Returns the intersect node or false
	result = doesIntersect(n0, n1, n2, n3);
	
	if (!result) {
		return false;
	} else {
		var alphaS = norm(n0, result) / norm(n0, n1);
		var alphaC = norm(n2, result) / norm(n2, n3);
		
		return {'alphaS': alphaS, 'alphaC': alphaC, 'x': result.x, 'y': result.y};
	}
}

// Function that uses the even/odd rule to determine if a point is inside of a polygon
// Takes a node object and node array representing a polygon
// Creates a line vector from the node parameter (x, y) to (0, y)
// Checks how many times it intersects with each polygon line segment
// Returns mod 2 of the intersection count: even is external node, odd is internal node
containmentTest = function (n0, poly) {
	var i,
		left = new node(0, n0.y, false, 0.0),
		type = 0;

	for (i = 0; i < poly.length; i++) {
		if (clipIntersect(left,
						  n0,
						  poly[i],
						  poly[(i === poly.length - 1) ? 0 : i + 1])) {
			type++;
		}
	}

	delete left;
	return type % 2;
}

// First determines the inside/outside value for one vertex of the subject polygon with containmentTest()
// If it is outside the other polygon then the next intersection point will be marked as entry (1)
// It it's inside then the next intersect will be an exit (0)
markEntryPoints = function (subject, clip, flag) {
	var e = containmentTest(subject[0], clip),
		i;

	// I think this has to do with the other possible boolean operations (http://davis.wpi.edu/~matt/courses/clipping/#two)
	if (flag){
		e = 1 - e;
	}

	// Once we found the entry/exit state of that first intersect we just alternate states for the successive intersect nodes
	for (i = 0; i < clip.length; i++) {
		if (clip[i].intersect) {
			clip[i].entry = e;
			e = 1 - e;
		}
	}

	return clip;
}

// Utility clipping function
// Takes two node arrays representing subject and clip polygons
// Need to add ability to pass path elements directly and type-check using Raphael.is(obj, "element")
Raphael.fn.clip = function(subject, clip) {
	var subjectLength = subject.length,
		clipLength = clip.length,
		subjectIndex,
		clipIndex,
		indexTo,
		i, j;

	// Step 1: Loop through all of the line segments and find intersects
	for (subjectIndex = 0; subjectIndex < subjectLength; subjectIndex++) {
		if (!subject[subjectIndex].intersect) {
			for (clipIndex = 0; clipIndex < clipLength; clipIndex++) {
				if (!clip[clipIndex].intersect) {

					// We need to find the next non-intersect node as well
					// Because we're working with arrays, we need to be sure that we stick within the bounds and wrap around the end
					// That's what this dumb hunk of code is doing

					// Initial next value inside bounds
					(subjectIndex + 1 === subjectLength) ? i = -subjectIndex : i = 1;
					// Increment and wrap around
					while (subject[subjectIndex + i].intersect) {
						i++;
						if (subjectIndex + i === subjectLength) {
							i = -subjectIndex;
						}
					}
					// Same steps here for the clip
					(clipIndex + 1 === clipLength) ? j = -clipIndex : j = 1;
					while (clip[clipIndex + j].intersect) {
						j++;
						if (clipIndex + j === clipLength) {
							j = -clipIndex;
						}
					}

					var result = clipIntersect(subject[subjectIndex],
												subject[subjectIndex + i],
												clip[clipIndex],
												clip[clipIndex + j]);
					
					if (result)	{
				 		subject.splice(subjectIndex + 1, 0, new node(result.x, result.y, true, 0.0));
				 		clip.splice(clipIndex + 1, 0, new node(result.x, result.y, true, 0.0));

				 		subjectLength++;
				 		clipLength++;
				 	}
				}
			}	
		}
	}

	// Step 2: Mark entry points for both polygons
	clip = markEntryPoints(subject, clip, true);
	subject = markEntryPoints(clip, subject, true);	

	// Step 3: Build the clipped polygon
	// Traverse the subject node list until you get to an entry/exit node, switch to clip node list
	// Traverse the clip node list until you get to an entry/exit node, switch to subject node list
	// Stop when you reach the first visited entry/exit node
	// The variable 'aux' represents the current node we're at
	var i = 0,
		aux = subject[i],
		newPolygon = [],
		subActive = true,
		forward = true;

	// Find the first subject entry intersect vertex
	while (!(aux.intersect && aux.entry > 0)) {
		i++;
		aux = subject[i];
	}
	subject[i].visited = true;
	aux = subject[i];
	newPolygon.push(aux);

	i++;
	if ((!subActive && i === clipLength) || (subActive && i === subjectLength)) { 
		i = 0;
	}

	aux = subject[i];
	subject[i].visited = true;

	// Traverse until we hit the first vertex we pushed
	while (aux.x !== newPolygon[0].x && aux.y !== newPolygon[0].y){

		newPolygon.push(aux);

		// If this is a entry/exit node, switch to the neighbour node
		if (aux.entry !== false) {

			// Find the neighbour if we're switching from subject to clip
			if (subActive) {
				i = 0;
				while (clip[i].x != aux.x && clip[i].y != aux.y) {
					i++;
				}

				// If it's an entry, go forward
				// If it's an exit, go backward
				if (clip[i].entry > 0) {
					forward = true;
				}
				else if (clip[i].entry === 0) {
					forward = false;
				}
			}
			// Find the neighbour if we're switching from clip to subject
			else {
				i = 0;
				while (subject[i].x != aux.x && subject[i].y != aux.y) {
					i++;
				}

				// If it's an entry, go forward
				// If it's an exit, go backward
				if (subject[i].entry > 0) {
					forward = true;
				}
				else if (subject[i].entry === 0) {
					forward = false;
				}
			}

			// Increment/decrement the counter
			if (forward) {
				i++;
			}
			else {
				i--;
			}

			subActive = !subActive;

			// Make sure we wrap around the appropriate array
			if (subActive && i === subjectLength) { 
				i = 0;
			}
			else if (subActive && i < 0) { 
				i = subjectLength - 1;
			}
			else if (!subActive && i === clipLength) {
				i = 0;
			}
			else if (!subActive && i < 0) {
				i = clipLength - 1;
			}

			// Update aux
			if (subActive) {
				subject[i].visited = true;
				aux = subject[i];
			}
			else {
				clip[i].visited = true;
				aux = clip[i];
			}
		}
		// Not an intersect, traverse ahead in the proper irection
		else {
			// Increment/decrement the counter
			if (forward) {
				i++;
			}
			else {
				i--;
			}

			// Make sure we wrap around the appropriate array
			if (subActive && i === subjectLength) { 
				i = 0;
			}
			else if (subActive && i < 0) { 
				i = subjectLength - 1;
			}
			else if (!subActive && i === clipLength) {
				i = 0;
			}
			else if (!subActive && i < 0) {
				i = clipLength - 1;
			}

			// Update aux
			if (subActive) {
				subject[i].visited = true;
				aux = subject[i];
			}
			else {
				clip[i].visited = true;
				aux = clip[i];
			}	
		}
	}

	return newPolygon;
}

// Clip the elements of a set
// Returns a new set containing the new polygons or false if none (no overlap)
Raphael.st.clip = function() {
	var setSize = this.length,
		subjectIndex = 0,
		clipIndex = 1,
		subjectNodes,
		clipNodes,
		result = null;

	// Get the node arrays for this pair
	subjectNodes = this[subjectIndex].toNodes();
	clipNodes = this[clipIndex].toNodes();

	// Clip the two polygons
	// Returns a node array of the clipped array or false if no overlap
	result = paper.clip(subjectNodes, clipNodes);

	// If we need to find the intersect of more than two polygons, let's loop it
	if (setSize >= 3) {
		for (clipIndex = 2; clipIndex < setSize; clipIndex++) {

			// Get the node array for the new polygon
			clipNodes = this[clipIndex].toNodes();

			// Format the result from before so we can clip it again (this could probably be "optimized" (read: fixed))
			result = paper.path("M" + result.join("L") + "Z").toNodes();
			
			// Clip it!
			result = paper.clip(result, clipNodes);
		}
	}

	// If there's a resultant clipped polygon, push it out formatted properly
	if (result) {
		var resultPath = paper.path("M" + result.join("L") + "Z");
	}

	// Return appropriately
	if(resultPath){
		return resultPath;
	} else {
		return false;
	}
};

// Takes the element's path string and converts it to an array of node objects
// Ensures that they are in a clockwise order
Raphael.el.toNodes = function() {

	// pathStringArray is in the form [[SVG instruction, x, y], ...]
	var pathStringArray = Raphael.parsePathString(this.attr("path")),
	nodeArray = [];
	pathStringArray.pop(); // Get rid of the Z instruction on the end

	pathStringArray.forEach (function(vertex) {
		nodeArray.push(new node(vertex[1], vertex[2], false, 0.0));
	});

	// Use the sum of the edges to determine the direction
	// http://stackoverflow.com/a/1165943/1082395
	var sum = 0;
	for (var i = 0; i < nodeArray.length; i++) {
		sum += (nodeArray[(i + 1 < nodeArray.length) ? i + 1 : 0].x - nodeArray[i].x) * (nodeArray[(i + 1 < nodeArray.length) ? i + 1 : 0].y + nodeArray[i].y)
	}

	// If it's CCW, reverse it
	if (sum < 0) {
		nodeArray.reverse();
	}

	return nodeArray;			
};