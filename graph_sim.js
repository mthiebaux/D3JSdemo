
import * as d3 from "https://cdn.skypack.dev/d3@7"; // GitHub recommended

export { create };

///////////////////////////////////////////////////////////////////////

function create( view, width, height )	{

	let svg = d3.select( view.select( "graphic" ) )
		.append( "svg" )
			.attr( "viewBox", [ -width / 2, -height / 2, width, height ] );

	let dfl_attr = {
		node_border()	{ return( 1.0 ); },
		node_radius()	{ return( 4.0 ); },
		node_color()	{ return( "#00f" ); },
		link_color()	{ return( "#999" ); },
		link_width()	{ return( 1.0 ); }
	};

	let sim = {

		svg,
		view,
		attr: dfl_attr,
		graph: null,
		engine: null,
		nodes: null, // these are not graph.nodes, these are sim.nodes
		links: null, // these are not graph.links, these are sim.links

		// export funcs
		init( graph, attr, view ) {
			init_simulation( this, graph, attr, view );
		},
		update() {
			update_simulation( this );
		},

		// edit status:
		select_nodes: [],
		select_links: []
	};
	return( sim );
}

///////////////////////////////////////////////////////////////////////

function init_simulation( sim, graph, attr )	{

	sim.attr = attr;
	sim.graph = graph;

	if( sim.engine ) sim.engine.stop();
	if( sim.links ) sim.links.remove();
	if( sim.nodes ) sim.nodes.remove();

	sim.links = sim.svg.append( "g" )
		.selectAll( "line" );

	sim.nodes = sim.svg.append( "g" )
		.selectAll( "circle" );

	// ID-based link references: d3.forceLink().id( d => d.id )
	// 	otherwise defaults to .index array offset
	// https://groups.google.com/g/d3-js/c/LWuhBeEipz4

	sim.engine = d3.forceSimulation()
//		.force( "link", d3.forceLink() )
		.force( "link", d3.forceLink().id( d => d.id ) )
		.force( "charge", d3.forceManyBody().strength( -50 ) )
		.force( "center", d3.forceCenter( 0, 0 ) )
		.force( "collision", d3.forceCollide().radius( (d) => d.radius ) ) // defaults to 1
		.force( "x", d3.forceX( 0 ) )
		.force( "y", d3.forceY( 0 ) )
		.on( "tick",
			() => {
				sim.links
					.attr( "x1", d => d.source.x.toFixed( 100 ) )
					.attr( "y1", d => d.source.y.toFixed( 100 ) )
					.attr( "x2", d => d.target.x.toFixed( 100 ) )
					.attr( "y2", d => d.target.y.toFixed( 100 ) );
				sim.nodes
					.attr( "cx", d => d.x.toFixed( 100 ) )
					.attr( "cy", d => d.y.toFixed( 100 ) ) // Safari browser patch
			}
		);
}

function update_simulation( sim )	{

	sim.engine.stop();

	sim.nodes = sim.nodes
		.data( sim.graph.nodes )
		.join(
			enter => enter.append( "circle" )
				.attr( "stroke", d => "#000" )
				.attr( "stroke-width", d => sim.attr.node_border( d ) )
				.attr( "fill", d => sim.attr.node_color( d ) )
				.attr( "r", d => sim.attr.node_radius( d ) )
				.on( "mousedown", mousedown_node )
				.call(
					d3.drag()
						.on( "start", dragstarted )
						.on( "drag", dragging )
						.on( "end", dragended )
				)
			,
			update => update
				.attr( "stroke-width", d => sim.attr.node_border( d ) )
				.attr( "fill", d => sim.attr.node_color( d ) )
				.attr( "r", d => sim.attr.node_radius( d ) )
			,
			exit => exit
				.remove()
		);

	sim.links = sim.links
		.data( sim.graph.links )
		.join(
			enter => enter.append( "line" )
				.attr( "stroke", d => sim.attr.link_color( d ) )
				.attr( "stroke-width", d => sim.attr.link_width( d ) )
				.on( "mousedown", mousedown_link )
			,
			update => update
				.attr( "stroke", d => sim.attr.link_color( d ) )
				.attr( "stroke-width", d => sim.attr.link_width( d ) )
			,
			exit => exit
				.remove()
		);

	sim.engine.nodes( sim.graph.nodes )
	sim.engine.force( "link" ).links( sim.graph.links );
	sim.engine.alphaTarget( 0.1 ).restart();

	function mousedown_node( event, node )	{

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

		let arr_i = sim.select_nodes.indexOf( node.index );
		if( arr_i == -1 )	{

			sim.select_nodes.push( node.index );
			node.group = 1;
		}
		else	{ // de-select

			sim.select_nodes.splice( arr_i, 1 );
			node.group = 0;
		}

		sim.update();
		sim.view.log( "node: " + node.id + " [ " + node.adjacent.join( ", " ) + " ] " + node.index );
	}

	function mousedown_link( event, link )	{

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down link: " + JSON.stringify( link, null, 2 ) );
//		console.log( this );

		let arr_i = sim.select_links.indexOf( link.index );
		if( arr_i == -1 )	{

			sim.select_links.push( link.index );
			link.group = 1;
		}
		else	{ // de-select

			sim.select_links.splice( arr_i, 1 );
			link.group = 0;
		}

		sim.update();
		sim.view.log( "link: [ " + link.source.id + ", " + link.target.id + " ] " + link.index );
	}

	function dragstarted( event, node ) {

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) );
//		console.log( "drag start event subject: " + JSON.stringify( event.subject, null, 2 ) );
//		console.log( "drag start node: " + JSON.stringify( node, null, 2 ) );

		if ( !event.active )
			sim.engine.alphaTarget( 0.9 ).restart(); // range [ 0, 1 ]
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}
	function dragging( event, node ) {

		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}
	function dragended( event, node ) {

		if ( !event.active )
			sim.engine.alphaTarget( 0 );
		event.subject.fx = null;
		event.subject.fy = null;
	}
}
