chai = require 'chai'
chai.should()

r = require 'node-raphael'
svg = r.generate 640, 640, (paper) ->
  global.paper = paper
  global.Raphael = paper.raphael

  {Node
   NodeArray
   doesIntersect
   norm
   containmentTest
   markIntersects
   markEntryPoints} = require '../raphael.polygons'

  describe 'Library helpers', ->

    describe 'Node object', ->
      it 'should have a toString method', ->
        n = new Node 1, 1, false
        n.toString().should.equal '1,1'

      it 'should default the intersect parameter to false', ->
        n = new Node 1, 1
        n.intersect.should.equal false
        m = new Node 1, 1, true
        m.intersect.should.equal true
        p = new Node 1, 1, false
        p.intersect.should.equal false

      it 'should determine if it lays on a line drawn between two given nodes', ->
        n = new Node 1, 1
        a = new Node 0, 0
        b = new Node 2, 2
        n.onLine(a,b).should.equal true

        c = new Node 3, 5
        n.onLine(a,c).should.equal false

    describe 'NodeArray object', ->
      it 'should have a nextFrom method', ->
        n = new Node 1, 1
        nn = new Node 1, 2
        a = new NodeArray n, nn
        a.nextFrom(n).should.deep.equal nn
        a.nextFrom(nn).should.deep.equal n
      it 'should have a prevFrom method', ->
        n = new Node 1, 1
        nn = new Node 1, 2
        a = new NodeArray n, nn
        a.prevFrom(nn).should.deep.equal n
        a.prevFrom(n).should.deep.equal nn

    describe 'doesIntersect', ->

      it 'should return false if the two lines don\'t intersect', ->
        a = new Node 2, 2
        b = new Node 4, 2
        c = new Node 0, 0
        d = new Node 2, 0
        doesIntersect(a,b,c,d).should.equal false

      it 'should return a Node object at the intersection point if the two lines intersect', ->
        a = new Node 2, 2
        b = new Node 4, 2
        c = new Node 3, 4
        d = new Node 3, 0
        doesIntersect(a,b,c,d).should.deep.equal new Node 3, 2, true

    describe 'norm', ->

      it 'should find the correct length of a line vector', ->
        a = new Node 0, 0
        b = new Node 5, 5
        norm(a,b).should.equal 7.0710678118654755

    describe 'containmentTest', ->

      it 'should return false if Node is outside of the node array polygon', ->
        n = new Node 0, 3
        a = new Node 0, 0
        b = new Node 1, 2
        c = new Node 2, 0
        containmentTest(n, new NodeArray(a,b,c)).should.equal false

      it 'should return true if Node is inside of the node array polygon', ->
        n = new Node 1, 1
        a = new Node 0, 0
        b = new Node 1, 2
        c = new Node 2, 0
        containmentTest(n, new NodeArray(a,b,c)).should.equal true

      it 'should return true if Node is on an edge of the node array polygon', ->
        n = new Node 1, 1
        a = new Node 0, 0
        b = new Node 2, 2
        c = new Node 2, 0
        containmentTest(n, new NodeArray(a,b,c)).should.equal true

    describe 'markIntersects', ->
      it 'should insert all points of intersection between two non-overlapping polygons', ->
        a = new Node 0, 5
        b = new Node 4, 3
        c = new Node 0, 0
        d = new Node 5, 5
        e = new Node 5, 0
        f = new Node 1, 3
        subject = [a,b,c]
        clip = [d,e,f]
        markIntersects subject, clip
        subject[1].intersect.should.equal true
        subject[2].intersect.should.equal false
        subject[3].intersect.should.equal true

      it 'should not insert any nodes if the polygons don\'t intersect', ->

    describe 'markEntryPoints', ->
      it 'should alternate between marking nodes as entries and exits', ->
        a = new Node 0, 5
        b = new Node 4, 3
        c = new Node 0, 0
        d = new Node 5, 5
        e = new Node 5, 0
        f = new Node 1, 3
        subject = [a,b,c]
        clip = [d,e,f]
        markIntersects subject, clip
        markEntryPoints subject, clip
        markEntryPoints clip, subject
        subject[0].entry.should.equal false
        subject[1].entry.should.equal false
        subject[2].entry.should.equal false
        subject[3].entry.should.equal true
        subject[4].entry.should.equal false
        clip[0].entry.should.equal false
        clip[1].entry.should.equal false
        clip[2].entry.should.equal false
        clip[3].entry.should.equal false
        clip[4].entry.should.equal true

  describe 'Raphael elements', ->

    describe 'toNodes', ->
      it 'should return a NodeArray object', ->
        e = paper.path 'M0,0L100,100L0,200Z'
        nodeArray = e.toNodes()
        (nodeArray instanceof NodeArray).should.equal true

      it 'should ensure CW order', ->
        e = paper.path 'M0,200L100,100L0,0Z'
        nodeArray = e.toNodes()
        nodeArray.toString().should.equal '0,0,100,100,0,200'
        e = paper.path 'M0,0L100,100L0,200Z'
        nodeArray = e.toNodes()
        nodeArray.toString().should.equal '0,0,100,100,0,200'

  describe 'Raphael sets', ->

  describe 'Raphael utility functions', ->

    describe 'clip', ->
      it 'should properly clip two simple convex polygons', ->
        a = paper.path 'M0,5L4,3L0,0Z'
        b = paper.path 'M5,5L5,0L1,3Z'
        el = Raphael.fn.clip a, b
        testString = 'M2.5,1.875L1,3L2.5,3.75L4,3Z'
        testCase = paper.path(testString).attr('path').toString()
        el.attr('path').toString().should.equal testCase