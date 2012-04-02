module("My Module");

test("addTwo", function () {
    equals(addTwo(0, 0), 0, "Add nothing.");
    equals(addTwo(1, 2), 3, "Add numbers.");
    equals(addTwo(-1, -2), -3, "Add negatives.");
});