
///////////////////////////////////////////////////////////////////////

let output_log_id = "";

function output_log_response( s )	{

	let log_area = document.getElementById( output_log_id );

	log_area.value += s;
	log_area.value += '\n';

	log_area.scrollTop = log_area.scrollHeight;
}

function log( o )	{

	output_log_response( JSON.stringify( o, null, 2 ) );
}

function clog( o )	{

	console.log( JSON.stringify( o, null, 2 ) );
}

///////////////////////////////////////////////////////////////////////

function build_node_map( nodes )	{

	let map = new Map();
	for( let i=0; i< nodes.length; i++ )	{
		map.set( nodes[ i ].id, i );
	}
	return( map );
}

function build_test_graph()	{

	let max_degree = 10;
	let degrees = [ 1, 2, 1 ];
	let nodes = [
		{ id: 0, adjacent: [ 1 ] },
		{ id: 1, adjacent: [ 0, 2 ] },
		{ id: 2, adjacent: [ 1 ] },
		{ id: 3, adjacent: [] }
	];
	let map = build_node_map( nodes );
	let links = [
		{ source: 0, target: 1 },
		{ source: 1, target: 2 }
	];

	return {
		max_degree,
		degrees,
		map,
		nodes,
		links
	};
}

function build_ring_graph( n, w )	{

	let max_degree = 10;
	let degrees = new Array( n ).fill( 2 * w );

	let nodes = [];
	for( let i=0; i< n; i++ )	{
		nodes.push( { id: i, adjacent: [] } );
	}
	let map = build_node_map( nodes );

	let links = [];
	for( let i=0; i< n; i++ )	{
		for( let j=0; j< w; j++ )	{

			let k = ( i + j + 1 ) % n;

			nodes[ i ].adjacent.push( k );
			nodes[ k ].adjacent.push( i );

			let [ s, t ] = [ i, k ].sort( ( a, b ) => a - b );
			links.push( { source: s, target: t } );
		}
	}

	return {
		max_degree,
		degrees,
		map,
		nodes,
		links
	};
}

function print_graph( G )	{

	console.log( "max_degree: " + G.max_degree );
	console.log( "degrees: [ " + G.degrees + " ]" );
	console.log( "map: ", [ ...( G.map.entries() ) ] );
	for( let i=0; i< G.nodes.length; i++ )	{
		console.log( "nodes: " + G.nodes[ i ].id + " [ " + G.nodes[ i ].adjacent + " ] " );
	}
	for( let i=0; i< G.links.length; i++ )	{
		console.log( "links: [ " + G.links[ i ].source + ", " + G.links[ i ].target + " ] " );
	}
}

function log_graph( G )	{

	log( "max_degree: " + G.max_degree );
	log( "degrees: [ " + G.degrees + " ]" );
	log( "map: " + JSON.stringify( [ ...( G.map.entries() ) ] ) );
	for( let i=0; i< G.nodes.length; i++ )	{
		log( "nodes: " + G.nodes[ i ].id + " [ " + G.nodes[ i ].adjacent + " ]" );
	}
	for( let i=0; i< G.links.length; i++ )	{
		log( "links: [ " + G.links[ i ].source.id + ", " + G.links[ i ].target.id + " ]" );
	}
}

///////////////////////////////////////////////////////////////////////

// https://thiebaux.site44.com/D3JSdemo/editor.html

function test_graph_editor( log_id, graph_plot_id )	{

	output_log_id = log_id;

	let graph = build_test_graph();

	let sim = create_simulation( 200, 200, graph_plot_id );
	init_simulation( sim, graph );

	d3.select( "#restart_simple_button" ).on(
		"mousedown",
		function( event )	{

			graph = build_test_graph();
			init_simulation( sim, graph );
		}
	);

	d3.select( "#restart_ring_button" ).on(
		"mousedown",
		function( event )	{

			graph = build_ring_graph( 6, 1 );
			init_simulation( sim, graph );
		}
	);

	d3.select( "#restart_chain_button" ).on(
		"mousedown",
		function( event )	{

			graph = build_ring_graph( 12, 2 );
			init_simulation( sim, graph );
		}
	);

	d3.select( "#print_button" ).on(
		"mousedown",
		function( event )	{

			log_graph( graph );
		}
	);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function collect_links( graph, node_index )	{

	let links = [];
	for( let i=0; i< graph.links.length; i++ )	{
		if(
			graph.links[ i ].source.index == node_index ||
			graph.links[ i ].target.index == node_index
		)	{
			links.push( i );
		}
	}
	return( links );
}

function detach_link( graph, link_index )	{

	let src_i = graph.links[ link_index ].source.index;
	let src_id = graph.links[ link_index ].source.id;

	let tgt_i = graph.links[ link_index ].target.index;
	let tgt_id = graph.links[ link_index ].target.id;

	let src_adj_i = graph.nodes[ src_i ].adjacent.indexOf( tgt_id );
	let tgt_adj_i = graph.nodes[ tgt_i ].adjacent.indexOf( src_id );

	graph.nodes[ src_i ].adjacent.splice( src_adj_i, 1 );
	graph.nodes[ tgt_i ].adjacent.splice( tgt_adj_i, 1 );
}

function execute_graph_delete( graph, select_links, select_nodes )	{

	let link_set = new Set( select_links );
	for( let i=0; i< select_nodes.length; i++ )	{

		let arr = collect_links( graph, select_nodes[ i ] );
		arr.forEach( l => link_set.add( l ) );
	}

	let link_arr = [ ...link_set ].sort( ( a, b ) => b - a  ); // descending
	for( let i=0; i< link_arr.length; i++ )	{

		detach_link( graph, link_arr[ i ] );
	}
	for( let i=0; i< link_arr.length; i++ )	{

		graph.links.splice( link_arr[ i ], 1 );
	}

	select_nodes.sort( ( a, b ) => b - a ); // descending
	for( let i=0; i< select_nodes.length; i++ )	{

		graph.nodes.splice( select_nodes[ i ], 1 );
	}

	graph.degrees = [];
	for( let i=0; i< graph.nodes.length; i++ )	{

		graph.degrees.push( graph.nodes[ i ].adjacent.length );
	}

	graph.map = build_node_map( graph.nodes );
//	return( edited );
}

///////////////////////////////////////////////////////////////////////

function add_new_node( graph )	{

	let new_id = 10; // 0; for testing
	while( graph.map.has( new_id ) ) new_id++;
	let new_i = graph.nodes.length;

	graph.nodes.push( { id: new_id, adjacent: [] } );
	graph.map.set( new_id, new_i );
	graph.degrees.push( 0 );

	return( new_i );
}

function add_new_link( graph, src_index, tgt_index )	{

	let src_id = graph.nodes[ src_index ].id;
	let tgt_id = graph.nodes[ tgt_index ].id ;

	if( graph.nodes[ src_index ].adjacent.includes( tgt_id ) == false )	{

		graph.nodes[ src_index ].adjacent.push( tgt_id );
		graph.nodes[ tgt_index ].adjacent.push( src_id );

		let [ s, t ] = [ src_id, tgt_id ].sort( ( a, b ) => a - b );
		graph.links.push( { source: s, target: t } );

		graph.degrees[ src_index ]++;
		graph.degrees[ tgt_index ]++;
	}
}

function execute_graph_add( graph, select_nodes )	{

	if( select_nodes.length == 0 )	{
		add_new_node( graph );
	}

	if( select_nodes.length == 1 )	{ // make new node, link
		select_nodes.push( add_new_node( graph ) );
	}

	if( select_nodes.length > 1 )	{ // link nodes in order
		for( let i=0; i< select_nodes.length - 1; i++ )	{

			add_new_link( graph, select_nodes[ i ], select_nodes[ i + 1 ] );
		}
	}
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function create_simulation( width, height, plot_div_id )	{

	let svg = d3.select( "#" + plot_div_id )
		.append( "svg" )
			.attr( "viewBox", [ -width / 2, -height / 2, width, height ] );

	let sim = {
		svg,
		engine: null,
		nodes: null,
		links: null,

		// status:
		select_nodes: [],
		select_links: [],
		select_node: -1,
		select_link: -1
	};
	return( sim );
}

function init_simulation( sim, graph )	{

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

	update_simulation( sim, graph );
}

///////////////////////////////////////////////////////////////////////

function degree_to_value( deg, max )	{

	return( 0.1 + deg / max );
}

function value_to_radius( v )	{

	return( 4 + 8 * v );
}

function degree_to_radius( deg, max )	{

	return( value_to_radius( degree_to_value( deg, max ) ) );
}

// https://github.com/d3/d3-scale-chromatic/blob/main/README.md
function extend_color_scheme( id )	{

	let i = id % 32;
	if( i < 10 ) return( d3.schemeCategory10[ i ] );
	if( i < 20 ) return( d3.schemeTableau10[ i - 10 ] );
	return( d3.schemeSet3[ i - 20 ] );
}

///////////////////////////////////////////////////////////////////////

function update_simulation( sim, graph )	{

	sim.engine.stop();

	sim.nodes = sim.nodes
		.data( graph.nodes )
		.join(
			enter => enter.append( "circle" )

				.attr( "stroke", d => "#000" )
				.attr( "stroke-width", d => 1.0 )

//				.attr( "fill", d => extend_color_scheme( d.id ) )
///*
				.attr( "fill",
					d => d3.interpolateTurbo(
						degree_to_value( d.adjacent.length, graph.max_degree )
					)
				)
//*/
				.attr( "r", d => 5.0 )
				.on( "mousedown", mousedown_node )
				.call(
					d3.drag()
						.on( "start", dragstarted )
						.on( "drag", dragging )
						.on( "end", dragended )
				)
			,
			update => update
				.attr( "stroke-width", d => 1.0 )
//				.attr( "fill", d => extend_color_scheme( d.id ) )
///*
				.attr( "fill",
					d => d3.interpolateTurbo(
						degree_to_value( d.adjacent.length, graph.max_degree )
					)
				)
//*/
			,
			exit => exit
				.remove()
		);

	sim.links = sim.links
		.data( graph.links )
		.join(
			enter => enter.append( "line" )
				.attr( "stroke", d => "#999" )
				.attr( "stroke-width", d => 3.0 )
				.on( "mousedown", mousedown_link )
			,
			update => update
				.attr( "stroke", d => "#999" )
				.attr( "stroke-width", d => 3.0 )
			,
			exit => exit
				.remove()
		);

	sim.engine.nodes( graph.nodes )
	sim.engine.force( "link" ).links( graph.links );
	sim.engine.alphaTarget( 0.1 ).restart();

	d3.select( "#add_button" ).on(
		"mousedown",
		function( event )	{

			execute_graph_add( graph, sim.select_nodes );

			sim.select_links = [];
			sim.select_nodes = [];

			update_simulation( sim, graph );
		}
	);

	d3.select( "#delete_button" ).on(
		"mousedown",
		function( event )	{

			execute_graph_delete( graph, sim.select_links, sim.select_nodes );

			sim.select_links = [];
			sim.select_nodes = [];

			update_simulation( sim, graph );
		}
	);

	function mousedown_node( event, node )	{ //// NODE

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

		let arr_i = sim.select_nodes.indexOf( node.index );
		if( arr_i != -1 )	{ // de-select

			sim.select_nodes.splice( arr_i, 1 );
			d3.select( this )
				.attr( "stroke-width", 1.0 );
			return;
		}

		d3.select( this )
			.attr( "stroke-width", 3.0 )

		sim.select_nodes.push( node.index );

//		console.log( "node: " + node.id + " [ " + node.adjacent + " ] " + node.index );
		log( "node: " + node.id + " [ " + node.adjacent + " ] " + node.index );
	}

	function mousedown_link( event, link )	{ //// LINK

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down link: " + JSON.stringify( link, null, 2 ) );
//		console.log( this );

		let arr_i = sim.select_links.indexOf( link.index );
		if( arr_i != -1 )	{ // de-select

			sim.select_links.splice( arr_i, 1 );
			d3.select( this )
				.attr( "stroke", "#999" )
				.attr( "stroke-width", 3.0 );
			return;
		}

		d3.select( this )
			.attr( "stroke", "#000" )
			.attr( "stroke-width", 5.0 );

		sim.select_links.push( link.index );

//		console.log( "link: [ " + link.source.id + ", " + link.target.id + " ] " + link.index );
		log( "link: [ " + link.source.id + ", " + link.target.id + " ] " + link.index );
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
			sim.engine.alphaTarget ( 0 );
		event.subject.fx = null;
		event.subject.fy = null;
	}
}

