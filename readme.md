**Raphaël.js Polygon Intersection**

Brandon Evans, 2012  
[brandonevans.ca](http://brandonevans.ca)  
[@interstateone](http://www.twitter.com/interstateone)  

Based on [Efficient Clipping of Arbitrary Polygons](http://davis.wpi.edu/~matt/courses/clipping/) by Gunther Greiner and Kai Hormann

Gives the ability to find the intersection of two or more polygons as a new polygon.
They can be concave or convex, but self-intersecting may not work properly.
Uses "node" objects to represent vertices of polygons and their intersection points.

The Good Stuff:

	- Raphael.fn.clip
		The general clipping function
		Takes two node arrays representing subject and clip, but the order is not important
		Returns the node array of the intersection or false if there isn't an intersection

	- Raphael.st.clip
		Takes advantage of the general clip function with sets
		Useful if there are more than two polygons you need to clip because this will find the total intersection

Utility Functions:
	
	- doesIntersect
		Takes two pairs of node objects representing line segments: no ------- n1, n2 ------- n3
		If they intersect a node is returned, if they don't intersect then "false" is returned

	- norm
		Takes one pair of node objects representing one line segment
		Returns the norm/length/magnitude of the line

	- clipIntersect
		Needs to be deprecated, not really needed

	- containmentTest
		Uses the even/odd rule to determine whether a point is inside another polygon
		Used by markEntryPoints in order to determine whether an intersection point is an entry or exit
		Takes a single node and a node array representing a polygon
		Returns 0 for an outside point or 1 for an inside point

	- markEntryPoints
		Marks the intersection points in one polygon as being entry or exits for the edges of the other polygon
		Uses containmentTest to determine the initial status, then alternates entry/exit
		Takes two node arrays to compare, and a flag setting
		Returns the updated node array with entry/exit statuses

	- Raphael.el.toNodes
		Function that converts an element's path to the node array that's needed for clipping
		Also makes sure that the nodes are in CW order
		Returns a node array in CW order