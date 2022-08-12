# D3JSdemo

 **D3.js Editor with scale-free graph generation**

* Live hosting at [thiebaux.site44.com](https://thiebaux.site44.com/D3JSdemo/index.html)

<img src="./images/screencap.png" width="200">

## Scale-Free Graphs

If you are going to practice tree and graph algorithms for traversal and feature detection, you will want tools to view and validate the results, and also a way to generate a variety of interesting graphs to test on. This project attempts to address both of these.

Scale-free networks are so called because they exhibit characteristics in common with natural networks found in the real world. In particular, the *degree distribution*, or distribution of edge counts among nodes, follows a *power law*, with most nodes having only a few edges (the boonies) and a few nodes having many (the hubs), regardless of size.

In order to algorithmically generate an endless variety of such graphs for testing and simulation, they are typically *grown* from scratch using a set of rules from which their desired characteristics emerge. This is the subject of much theoretical analysis in the network literature. While a graph may seem like a rather simple construct, it can contain vast structural complexity.

The graph shown here is grown using the *Configuration Model*, which applies a prescribed degree distribution to a set of nodes, assigning to each one a number of unmatched edge stubs. These stubs are then randomly assigned to each other using a pair matching algorithm. Care must be taken to avoid introducing biases that could invalidate the desired properties.

<img src="./images/screencap2.png" width="200">

## D3 Web Visualization

Using D3.js open source visualization tools, the resulting graph is displayed interactively within the web page. Each *restart* generates a new graph with the same properties. Each node can be touched and dragged around, rearranging the spatial configuration using force calculations (global gravitation and local repulsion). By "massaging" the layout, you can coerce it to relax, exposing hidden structure. The slider controls the random mutation rate, and the graph evolves.

<img src="./images/screencap3.png" width="200">

## Learning Curve

Knowing almost nothing about *SVG* tags and D3 visualization development, I set out examining a dozen or more code examples demonstrating a variety of functionality, as well as cryptic and outdated tutorials. I then migrated those codes from their v3 and v4 syntax into the latest v7, which is not backward compatible. A problem for reverse engineering.

Finally, I stress test the resulting code with a scalable, high performance set of operations, of some interest to graph theorists. A histogram of cumulative mutations shows consistent power law distribution of node degree, while sensitive to initial conditions. Style transition chains are seductive, and troublesome when the graph is edited.

<img src="./images/screencap4.png" width="200">

## Graph Editor

* Live hosting at [thiebaux.site44.com](https://thiebaux.site44.com/D3JSdemo/editor.html)


...
Each node maintains a separate list of its neighbors (adjacency array), for ease of traversal. When a node is deleted, there is a lot of book-keeping to keep straight. We can’t just use the simplest graph representation typically used for a search task. We also need maintain a separate edge list curated for the D3 visualizer. To support deletion, each node must be referred to by unique name, rather than its position in the array. These are kept in a hash map.

While testing degenerate cases, I discovered a rare error message streaming from the D3 force engine, dealing with numeric precision handling in the Safari browser. When you are down to two nodes and then delete one of them, after ten seconds the position coordinates of the remaining node fall under 1.0e-100, which can't be mapped from a numeric string to a raw number for the SVG element. Too close to zero without being zero. This can go unnoticed because *undefined* resolves to zero.









