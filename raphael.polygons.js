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
// ************************************************************************************************

function Node(x, y, intersect) {
	this.x = x;
	this.y = y;
	this.intersect = (intersect) ? intersect : false;
	this.entry = false;
	this.visited = false;

	// Is this node on a given line segment?
	// Returns: true / false
	this.onLine = function(n0, n1) {

		// Get vectors for the line segment and from this node to n0
		// Ratio of dot prodcuts gives the projection of one onto the other
		var v0    = new Node(n1.x - n0.x, n1.y - n0.y),
			vthis = new Node(this.x - n0.x, this.y - n0.y),
			ratio,
			denom = v0.x * v0.x + v0.y * v0.y;

		// First line segment has zero length, are these equal points?
		if (denom === 0.0) {
			return (this.x == n0.x && this.y == n0.y);
		} else {
			ratio = (v0.x * vthis.x + v0.y * vthis.y ) / denom;
			return ((ratio >= 0.0) && (ratio <= 1.0));
		}
	};

	this.toString = function() {
		return this.x + "," + this.y;
	};
}

// Node object
// Used for each vertex of a polygon and the intersects

// Finds if two line segments intersect
// Takes two pairs of nodes
// Returns: the intersect node or false
// http://stackoverflow.com/a/1968345/1082395
var doesIntersect = function(n0, n1, n2, n3) {

	var denom = (n3.y - n2.y) * (n1.x - n0.x) - (n3.x - n2.x) * (n1.y - n0.y);

    // Parallel
    if (denom === 0) {
		return false;
    }

    var ua = ((n3.x - n2.x) * (n0.y - n2.y) - (n3.y - n2.y) * (n0.x - n2.x)) / denom,
		ub = ((n1.x - n0.x) * (n0.y - n2.y) - (n1.y - n0.y) * (n0.x - n2.x)) / denom,
		x = n0.x + ua * (n1.x - n0.x),
		y = n0.y + ua * (n1.y - n0.y),
		result = new Node(x, y, true);

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        // Collision detected
        return result;
    } else {
		// No collision
		return false;
    }
};

// Returns the norm (length) of a line vector
var norm = function(n0, n1) {
	return Math.sqrt(((n1.x - n0.x) * (n1.x - n0.x)) + ((n1.y - n0.y) * (n1.y - n0.y)));
};

// Function that uses the even/odd rule to determine if a point is inside of a polygon
// Takes a node object and node array representing a polygon
// Creates a line vector from the node parameter (x, y) to (0, y)
// Checks how many times it intersects with each polygon line segment
// Returns mod 2 of the intersection count: even is external node, odd is internal node
var containmentTest = function(n0, poly) {
	var i,
		left = new Node(0, n0.y, false),
		type = 0;

	for (i = 0; i < poly.length; i++) {
		if (doesIntersect(left,
						  n0,
						  poly[i],
						  poly[(i === poly.length - 1) ? 0 : i + 1])) {
			type++;
		}
	}
	return (Boolean)(type % 2);
};

// First determines the inside/outside value for one vertex of the subject polygon with containmentTest()
// If it is outside the other polygon then the next intersection point will be marked as entry (1)
// It it's inside then the next intersect will be an exit (0)
var markEntryPoints = function(subject, clip, flag) {
	var e = containmentTest(subject[0], clip),
		i;

	// I think this has to do with the other possible boolean operations (http://davis.wpi.edu/~matt/courses/clipping/#two)
	if (flag){
		e = !e;
	}

	// Once we found the entry/exit state of that first intersect we just alternate states for the successive intersect nodes
	for (i = 0; i < clip.length; i++) {
		if (clip[i].intersect) {
			clip[i].entry = e;
			e = !e;
		}
	}
};

var markIntersects = function(subject, clip) {
	var subjectLength = subject.length,
		clipLength = clip.length,
		subjectIndex,
		clipIndex,
		i, j;

	for (subjectIndex = 0; subjectIndex < subjectLength; subjectIndex++) {
		if (!subject[subjectIndex].intersect) {
			for (clipIndex = 0; clipIndex < clipLength; clipIndex++) {
				if (!clip[clipIndex].intersect) {

					// We need to find the next non-intersect node as well
					// Because we're working with arrays, we need to be sure that we stick within the bounds and wrap around the end
					// That's what this dumb hunk of code is doing

					// Initial next value inside bounds
					if (subjectIndex + 1 === subjectLength) {
						i = -subjectIndex;
					}
					else {
						i = 1;
					}

					// Increment and wrap around
					while (subject[subjectIndex + i].intersect) {
						i++;
						if (subjectIndex + i === subjectLength) {
							i = -subjectIndex;
						}
					}

					// Same steps here for the clip
					if (clipIndex + 1 === clipLength) {
						j = -clipIndex;
					}
					else {
						j = 1;
					}

					while (clip[clipIndex + j].intersect) {
						j++;
						if (clipIndex + j === clipLength) {
							j = -clipIndex;
						}
					}

					var result = doesIntersect(subject[subjectIndex],
												subject[subjectIndex + i],
												clip[clipIndex],
												clip[clipIndex + j]);

					if (result)	{
						subject.splice(subjectIndex + 1, 0, result);
						clip.splice(clipIndex + 1, 0, result);
						subjectLength++;
						clipLength++;
					}
				}
			}
		}
	}
}

// Utility clipping function
// Takes two path element objects representing subject and clip polygons
// Returns the resultant clipped polygons as a Raphael.js element object
Raphael.fn.clip = function(subject, clip) {

	var subjectLength,
		clipLength;

	// Convert the two Raphael paths to Node arrays
	subject = subject.toNodes();
	clip = clip.toNodes();

	// Loop through all of the line segments and find intersects
	markIntersects(subject, clip);

	// Mark entry points for both polygons
	markEntryPoints(subject, clip, true);
	markEntryPoints(clip, subject, true);

	// Build the clipped polygon
	// Traverse the subject node list until you get to an entry/exit node, switch to clip node list
	// Traverse the clip node list until you get to an entry/exit node, switch to subject node list
	// Stop when you reach the first visited entry/exit node
	// The variable 'aux' represents the current node we're at
	var aux = subject[0],
		newPolygon = [],
		subActive = true,
		forward = true;

	i = 0;

	// Start at the first subject entry vertex
	while (aux.entry != true) {
		i++;
		aux = subject[i];
	}
	subject[i].visited = true;

	// Traverse until we hit the first vertex we pushed
	do {
		newPolygon.push(aux);

		// If this is an intersect node, switch to the neighbour node
		if (aux.intersect === true) {

			// Find the neighbour if we're switching from subject to clip
			if (subActive) {
				i = 0;
				while (clip[i].x != aux.x && clip[i].y != aux.y) {
					i++;
				}

				// If it's an entry, go forward
				// If it's an exit, go backward
				if (clip[i].entry === false) {
					forward = true;
				}
				else {
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
				if (subject[i].entry === true) {
					forward = true;
				}
				else {
					forward = false;
				}
			}

			// We just switched arrays
			subActive = !subActive;

			// Increment/decrement the counter
			if (forward) {
				i++;
			}
			else {
				i--;
			}

			// Make sure we wrap around the appropriate array if we need to
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

			// Update aux to the new node
			if (subActive) {
				subject[i].visited = true;
				aux = subject[i];
			}
			else {
				clip[i].visited = true;
				aux = clip[i];
			}
		}
		// Not an intersect, traverse ahead in the proper direction
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
	} while (aux.x !== newPolygon[0].x && aux.y !== newPolygon[0].y);

	return paper.path("M" + newPolygon.join("L") + "Z");
};
// End of Raphael.fn.clip()

// Utility join function
// Takes two path element objects
// Returns the joined path object
// The only difference between this and the clip function is the starting entry/exit status of the mark function
Raphael.fn.join = function(subject, clip) {

	subject = subject.toNodes();
	clip = clip.toNodes();

	var subjectLength = subject.length,
		clipLength = clip.length,
		subjectIndex,
		clipIndex,
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
					if (subjectIndex + 1 === subjectLength) {
						i = -subjectIndex;
					}
					else {
						i = 1;
					}

					// Increment and wrap around
					while (subject[subjectIndex + i].intersect) {
						i++;
						if (subjectIndex + i === subjectLength) {
							i = -subjectIndex;
						}
					}

					// Same steps here for the clip
					if (clipIndex + 1 === clipLength) {
						j = -clipIndex;
					}
					else {
						j = 1;
					}

					while (clip[clipIndex + j].intersect) {
						j++;
						if (clipIndex + j === clipLength) {
							j = -clipIndex;
						}
					}

					var result = doesIntersect(subject[subjectIndex],
												subject[subjectIndex + i],
												clip[clipIndex],
												clip[clipIndex + j]);

					if (result)	{
						subject.splice(subjectIndex + 1, 0, result);
						clip.splice(clipIndex + 1, 0, result);
						subjectLength++;
						clipLength++;
					}
				}
			}
		}
	}

	// Step 2: Mark entry points for both polygons
	markEntryPoints(subject, clip, false);
	markEntryPoints(clip, subject, false);

	// Step 3: Build the clipped polygon
	// Traverse the subject node list until you get to an entry/exit node, switch to clip node list
	// Traverse the clip node list until you get to an entry/exit node, switch to subject node list
	// Stop when you reach the first visited entry/exit node
	// The variable 'aux' represents the current node we're at
	var aux = subject[0],
		newPolygon = [],
		subActive = true,
		forward = true;

	i = 0;

	// Start at the first subject entry vertex
	while (aux.entry != true) {
		i++;
		aux = subject[i];
	}
	subject[i].visited = true;

	// Traverse until we hit the first vertex we pushed
	do {
		newPolygon.push(aux);

		// If this is an intersect node, switch to the neighbour node
		if (aux.intersect === true) {

			// Find the neighbour if we're switching from subject to clip
			if (subActive) {
				i = 0;
				while (clip[i].x != aux.x && clip[i].y != aux.y) {
					i++;
				}

				// If it's an entry, go forward
				// If it's an exit, go backward
				if (clip[i].entry === false) {
					forward = true;
				}
				else {
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
				if (subject[i].entry === true) {
					forward = true;
				}
				else {
					forward = false;
				}
			}

			// We just switched arrays
			subActive = !subActive;

			// Increment/decrement the counter
			if (forward) {
				i++;
			}
			else {
				i--;
			}

			// Make sure we wrap around the appropriate array if we need to
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

			// Update aux to the new node
			if (subActive) {
				subject[i].visited = true;
				aux = subject[i];
			}
			else {
				clip[i].visited = true;
				aux = clip[i];
			}
		}
		// Not an intersect, traverse ahead in the proper direction
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
	} while (aux.x !== newPolygon[0].x && aux.y !== newPolygon[0].y);

	return paper.path("M" + newPolygon.join("L") + "Z");
	// End of Raphael.fn.clip()
};

// Clip the elements of a set
// Returns a new set containing the new polygons or false if none (no overlap)
/*Raphael.st.clip = function() {
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
};*/

// Clip the elements of a set
// Returns a new set containing the new polygons or false if none (no overlap)
Raphael.st.join = function() {
	var setSize = this.length,
		clipIndex,
		result = null;

	// Clip the two polygons
	// Returns a path object of the joined polygon or false if no overlap
	result = paper.join(this[0], this[1]);

	// If we need to find the sum of more than two polygons, let's loop it
	if (setSize >= 3) {
		for (clipIndex = 2; clipIndex < setSize; clipIndex++) {
			
			// Clip it!
			result = paper.join(result, this[clipIndex]);
		}
	}

	// Return appropriately
	if(result){
		return result;
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
	if (pathStringArray[pathStringArray.length - 1][0] === "Z") {
		pathStringArray.pop(); // Get rid of the Z instruction on the end	
	}

	pathStringArray.forEach (function(vertex) {
		nodeArray.push(new Node(vertex[1], vertex[2], false));
	});

	// Use the sum of the edges to determine the direction
	// http://stackoverflow.com/a/1165943/1082395
	var sum = 0;
	for (var i = 0; i < nodeArray.length; i++) {
		sum += (nodeArray[(i + 1 < nodeArray.length) ? i + 1 : 0].x - nodeArray[i].x) * (nodeArray[(i + 1 < nodeArray.length) ? i + 1 : 0].y + nodeArray[i].y);
	}

	// If it's CCW, reverse it
	if (sum > 0) {
		nodeArray.reverse();
	}
	return nodeArray;			
};