module("Node");

test("should have a toString method with coordinates", function () {
	n = new Node(1,1, false);
    equals(n.toString(), "1,1", "Print coordinates");
});

test("should default the intersect parameter to false", function () {
	n = new Node(1,1);
    equals(n.intersect, false, "Intersect isn't passed, should be false");
    m = new Node(1,1, true);
    equals(m.intersect, true, "Intersect true is passed, should be true");
    p = new Node(1,1, false);
    equals(p.intersect, false, "Intersect false is passed, should be false");
});

test("should determine if they lay on a line drawn between two given nodes", function () {
	n = new Node(1,1);
	a = new Node(0,0);
	b = new Node(2,2);
	equals(n.onLine(a,b), true, "Should lay on line");

	c = new Node(3,5);
	equals(n.onLine(a,c), false, "Should not lay on line");
});

module("doesIntersect");

test("should return false if the two lines don't intersect", function () {
	a = new Node(2,2);
	b = new Node(4,2);

	c = new Node(0,0);
	d = new Node(2,0);
	equals(doesIntersect(a,b,c,d), false, "Lines don't intersect, should return false.");
});

test("should return a Node object at the intersection point if the two lines intersect", function () {
	a = new Node(2,2);
	b = new Node(4,2);

	c = new Node(3,4);
	d = new Node(3,0);
	deepEqual(doesIntersect(a,b,c,d), new Node(3,2,true), "Lines intersect, should return a node.");
});

module("containmentTest");