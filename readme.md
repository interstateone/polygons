Raphaël.js Polygon Intersection
===

## This project has been deprecated

I no longer maintain or provide support for this project. It remains on GitHub as a record of the project and for any possible benefits to others.

---

Gives the ability to find the intersection of two or more polygons as a new polygon.
They can be concave or convex, but self-intersecting may not work properly.
Uses "node" objects to represent vertices of polygons and their intersection points.

Based on [Efficient Clipping of Arbitrary Polygons](http://davis.wpi.edu/~matt/courses/clipping/) by Gunther Greiner and Kai Hormann

Run the tests with `mocha --compilers coffee:coffee-script`

Download
---
**JavaScript:** [development](http://compiler.herokuapp.com/?coffee=https://raw.github.com/interstateone/polygons/master/raphael.polygons.coffee&filename=raphael.polygons) or [production](http://compiler.herokuapp.com/?coffee=https://raw.github.com/interstateone/polygons/master/raphael.polygons.coffee&filename=raphael.polygons&uglify=true)

Downloads are prepared with [Compiler](https://github.com/darkhelmet/compiler)

The Good Stuff
---

**Raphael.fn.clip**  
The general clipping function. Takes two node arrays representing subject and clip, but the order is not important. Returns a new Raphaël element with the clipped path.

**Raphael.st.clip**
Like above but it'll recursively clip all elements in a set. Note that you'll get nothing back if there is not a common area between all elements.

Making the Sausage
---

**Node object**
The object used internally to represent points on a path.

**NodeArray**
A uh… array of nodes… Provides basic next/previous node methods

**doesIntersect**
Takes two pairs of node objects representing line segments: n0-n1, n2-n3. If they intersect then a node is returned, otherwise false.

**norm**
Takes one pair of node objects representing one line segment. Returns the norm/length/magnitude of the line.

**containmentTest**
Uses the even/odd rule to determine whether a point is inside another polygon. Used by markEntryPoints in order to determine whether an intersection point is an entry or exit.	Takes a single node and a node array representing a polygon. Returns true for an inner node, false for an outer node.

**markIntersects**
Finds all of the intersect points between two polygons and inserts corresdonding linked nodes into each node array.

**markEntryPoints**
Marks the intersection points in one polygon as being entry or exits for the edges of the other polygon. Uses containmentTest to determine the initial status, then alternates entry/exit. Takes two node arrays to compare, and a flag setting. Returns the updated node array with entry/exit statuses.

**Raphael.el.toNodes**
Method that converts an element's path to the node array that's needed for clipping. Also makes sure that the nodes are in CW order.
