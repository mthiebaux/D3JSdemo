
let output_log_id = "";
let graph_plot_id = "";
let histo_plot_id = "";

///////////////////////////////////////////////////////////////////////

function output_log_response( s )	{

	let log_area = document.getElementById( output_log_id );

	log_area.value += s;
	log_area.value += '\n';

	log_area.scrollTop = log_area.scrollHeight;
}

function rand_range( ge_min, lt_max )	{

	return( ( Math.random() ) * ( lt_max - ge_min ) + ge_min );
}

function rand_int_range( ge_min, lt_max )	{

	return( Math.floor( rand_range( ge_min, lt_max ) ) );
}

// https://willnewton.name/2013/09/10/a-simple-power-law-pseudo-random-number-generator/
function rand_pow_law( ge_min, lt_max, exp = 2.0 )	{

	let min_pow = Math.pow( ge_min, 1.0 - exp );
	let max_pow = Math.pow( lt_max, 1.0 - exp );
	let rand_pow = Math.pow(
		rand_range( min_pow, max_pow ),
		1.0 / ( 1.0 - exp )
	);
	return( rand_pow );
}

function shuffle_array( arr )	{

	for( let i=0; i< arr.length; i++ )	{
		let j = rand_int_range( i, arr.length ); // must allow null-swap
		let tmp = arr[ i ];
		arr[ i ] = arr[ j ];
		arr[ j ] = tmp;
	}
	return( arr );
}

function shuffle_array_copy( arr )	{

	return( shuffle_array( [ ...arr ] ) );
}

function generate_unique_rand_arr( min, max )	{

	// each integer in range appears once

	let arr = [];
	let n = max - min;
	for( let i=0; i<= n; i++ )	{
		arr[ i ] = min + i;
	}
	return( shuffle_array( arr ) );
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function generate_degree_sequence( len, min, max )	{

	let seq = Array( len );
	for( let i=0; i< len; i++ )	{
		seq[ i ] = Math.floor( rand_pow_law( min, max + 1 ) );
	}
	return( seq );
}
function generate_stub_array( seq )	{

	//    degree sequence  -->  stub-array
	//   [ 1,1,1,1,2,3,3 ] --> [ 1,2,3,4,5,5,6,6,6,7,7,7 ]		1-indexing from paper
	//   [ 1,1,1,1,2,3,3 ] --> [ 0,1,2,3,4,4,5,5,5,6,6,6 ]		0-indexing
	//   [ 0,8,4,2 ]       --> [ 1,1,1,1,1,1,1,1,2,2,2,2,3,3 ]	0-indexing from paper

	let arr = [];
	for( let i=0; i< seq.length; i++ )	{

		for( let j=0; j< seq[ i ]; j++ )	{

			arr.push( i );
		}
	}
	return( arr );
}
function balance_stub_array( stubs )	{

	// ensure even number of stubs
	// add random stub if necessary
	// bias toward nodes with more stubs

	let arr = [ ...stubs ];
	if( arr.length % 2 == 0 )	{
		return( arr );
	}
	let r = rand_int_range( 0, arr.length );
	arr.push( arr[ r ] );
	return( arr );
}

///////////////////////////////////////////////////////////////////////

function test_graph( log_id, graph_id, histo_id )	{

	output_log_id = log_id;
	graph_plot_id = graph_id;
	histo_plot_id = histo_id;

//	let min_degree = 0.25;
//	let min_degree = 0.5;
	let min_degree = 0.75;
//	let min_degree = 1;
//	let min_degree = 2;
//	let min_degree = 4;
	let max_degree = 12;
	let num_nodes = 64;

if( 0 )	{
	max_degree = 6;
	num_nodes = 8;
}
else
if( 0 )	{
	max_degree = 16;
	num_nodes = 64;
}
else
if( 1 )	{
	max_degree = 16;
	num_nodes = 128;
}
else
if( 1 )	{
	max_degree = 64;
	num_nodes = 128;
}

	let node_degrees = new Array( num_nodes );
	let num_histo_buckets = max_degree + 1;

	let histo = new Array( max_degree + 1 ).fill( 0 );
	let num_stubs = 0;
	for( let i=0; i< num_nodes; i++ )	{

		let v = Math.floor( rand_pow_law( min_degree, max_degree + 1 ) );

//console.log( min_degree, max_degree, v );

		node_degrees[ i ] = v;
		histo[ v ]++;
		num_stubs += v;
	}

	output_log_response( "stubs: " + num_stubs );
	output_log_response( "-" );
	output_log_response( "node degree: " );
	for( let i=0; i< num_nodes; i++ )
		output_log_response( i + ": " + node_degrees[ i ] );
	output_log_response( "-" );
	output_log_response( "histogram: " );
	for( let i=0; i<= max_degree; i++ )
		output_log_response( i + ": " + histo[ i ] );
	output_log_response( "-" );


/////////////////

//   degree sequence  -->  stub-array                      rstubs: shuffled
//  [ 1,1,1,1,2,3,3 ] --> [ 0,1,2,3,4,4,5,5,5,6,6,6 ] --> [ 4,5,0,4,5,6,6,1,5,3,2,6 ]

	let deg_seq = [ ...node_degrees ];	// from top of this function
//	let deg_seq = [ 1,1,1,2,3,3 ];		// len 11 --> bal to 12 --> 6 edges
//	let deg_seq = [ 1,1,1,1,2,3,3 ];	// len 12 --> 6 edges
//	let deg_seq = [ 0,8,4,2 ];			// len 14 --> 7 edges

	let stubs = generate_stub_array( deg_seq );

	let rstubs = shuffle_array_copy( stubs );

	let brstubs = balance_stub_array( rstubs );

/////////////////

	let N = deg_seq.length; // node count

	let adjacencies = [];
	for( let i=0; i< N; i++ )	{
		adjacencies[ i ] = [];
	}
	let edges = [];

	stub_vec = [ ...brstubs ];

	// stub pair matching, best effort
	// avoid self loops and double edges

	for( let i=0; i< N; i++ )	{

		let n = deg_seq[ i ];	// node has n stubs
		let c = 0;				// stubs index

		while( ( c < stub_vec.length ) && ( adjacencies[ i ].length < n ) )	{

			let p = stub_vec[ c ];	// pairing candidate

			if( ( p >= 0 )&&( p != i ) )	{	// available and not self

				if( adjacencies[ p ].includes( i ) == false )	{ // not duplicate

					// store edge and adjacents
					let e = [ i, p ].sort( ( a, b ) => a - b ); // sort for undirected
					edges.push( e );
					adjacencies[ i ].push( p );
					adjacencies[ p ].push( i );

					// invalidate both stubs
					stub_vec[ c ] = -1;
					let found = false;
					for( let j=0; !found && ( j< stub_vec.length ); j++ )	{

						if( stub_vec[ j ] == i )	{ // remove first self stub found
							stub_vec[ j ] = -1;
							found = true;
						}
					}
				}
			}
			c++;
		}
	}

	if( 0 )	{
		console.log( "adjacencies:" );
		for( let i=0; i< adjacencies.length; i++ )	{
			console.log( adjacencies[ i ] );
		}
		console.log( "edges:" );
		for( let i=0; i< edges.length; i++ )	{
			console.log( edges[ i ] );
		}
	}

/////////////////

if( 1 )	{
	let graph_data = {
		max_degree: max_degree,
		nodes: [],
		links: []
	};

	for( let i=0; i< N; i++ )	{

		let d = adjacencies[ i ].length;

		graph_data.nodes.push(
			{
				id: i, // redundant ?
				group: 0,
				degree: d,
				adjacent: adjacencies[ i ]
			}
		);
	}
	for( let i=0; i< edges.length; i++ )	{

		graph_data.links.push(
			{
				source: edges[ i ][ 0 ],
				target: edges[ i ][ 1 ]
			}
		);
	}

//	mbostock_force_graph( graph_data, 300, 300, graph_plot_id );

//	mbostock_modify_graph( graph_data, 500, 500, graph_plot_id );

	mbostock_drag_graph( graph_data, 300, 300, graph_plot_id );
}
else	{

	let graph_data = {
		max_degree: 10,
		nodes: [
			{ id: 0, degree: 1  },
			{ id: 1, degree: 1  },
			{ id: 2, degree: 1  },
			{ id: 3, degree: 1  }
		],
		links: [
			{ source: 0, target: 1 },
			{ source: 2, target: 3 }
		]
	};

//	mbostock_force_graph( graph_data, 300, 300, graph_plot_id );

//	mbostock_modify_graph( graph_data, 500, 300, graph_plot_id );

	mbostock_drag_graph( graph_data, 300, 300, graph_plot_id );
}


//	ForceGraph( graph_data, { width: 400, height: 400 } );

	simple_histogram( num_histo_buckets, node_degrees, 300, 200 );
//	observablehq_log_histo( num_histo_buckets, node_degrees );
//	Histogram( node_degrees, { thresholds: num_histo_buckets, width: 340, height: 200 } );

}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function degree_to_value( deg, max )	{
//	return( 0.02 + 0.98 * deg / max );
	return( 0.05 + 0.95 * deg / max );
}

function value_to_radius( v )	{
//	return( 2 + 10 * v );
	return( 4 + 8 * v );
}

function degree_to_radius( deg, max )	{
	return( value_to_radius( degree_to_value( deg, max ) ) );
}

///////////////////////////////////////////////////////////////////////

function mbostock_drag_graph( graph, width, height, plot_div_id )	{

	let svg = d3.select( "#" + plot_div_id )
		.append( "svg" )
//		.attr( "viewBox", [ -width / 2, -height / 2, width, height ] );
		.attr( "viewBox", [ -width, -height, 2 * width, 2 * height ] );

	const simulation = d3.forceSimulation()
		.force( "link", d3.forceLink() )
		.force( "charge", d3.forceManyBody().strength( -50 ) )
		.force( "center", d3.forceCenter( 0, 0 ) )
		.force( "x", d3.forceX( 0 ) )
		.force( "y", d3.forceY( 0 ) )
		.on( "tick", simulation_tick );

	let link_group = svg.append( "g" )
		.attr( "stroke", d => "#000" )
		.attr( "stroke-opacity", d => 0.2 )
		.attr( "stroke-width", d => 2.0 )
		.selectAll( "line" );

	let node_group = svg.append( "g" )
		.attr( "stroke", d => "#000" )
		.attr( "stroke-width", 0.5 )
		.selectAll( "circle" );

	function simulation_tick() {
		link_group
			.attr( "x1", d => d.source.x )
			.attr( "y1", d => d.source.y )
			.attr( "x2", d => d.target.x )
			.attr( "y2", d => d.target.y );
		node_group
			.attr( "cx", d => d.x )
			.attr( "cy", d => d.y );
	}

    function update_simulation() {

		simulation.stop();

		node_group = node_group
//			.data( graph.nodes, d => d.id ) // need key function for editing?
			.data( graph.nodes )
			.join(
				enter => enter.append( "circle" )
					.attr( "r",
						d => degree_to_radius( d.degree, graph.max_degree )
					)
					.attr( "fill",
						d => d3.interpolateTurbo( degree_to_value( d.degree, graph.max_degree ) )
					)
					.on( "mousedown", mousedown )
//					.on( "click", mouseclick ) // down and up
					.on( "dblclick", mousedblclick )
//					.on( "mouseover", mouseover )
//					.on( "mouseout", mouseout )
					.call(
						d3.drag()
							.on( "start", dragstarted )
							.on( "drag", dragging )
							.on( "end", dragended )
					),
				update => update
					.attr( "r",
						d => degree_to_radius( d.degree, graph.max_degree )
					)
					.attr( "fill",
						d => d3.interpolateTurbo( degree_to_value( d.degree, graph.max_degree ) )
					)
			);

		link_group = link_group
//			.data( graph.links, d => [ d.source, d.target ] )
			.data( graph.links )
//			.join( "line" );
			.join(
				enter => enter.append( "line" )
					.on( "mousedown", mousedown_link )
			);

		simulation.nodes( graph.nodes )
		simulation.force( "link" ).links( graph.links );
		simulation.alphaTarget( 0.1 ).restart();
    }
    update_simulation();

	function mousedown_link( event, link )	{

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
		console.log( "down link: " + JSON.stringify( link, null, 2 ) );

		d3.select( this )
			.attr( "stroke-width", 8.0 );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "stroke-width", 2.0 );
	}
	function mousedown( event, node )	{

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

		let rad = degree_to_radius( node.degree, graph.max_degree );
		d3.select( this )
			.attr( "r", 2 * rad );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "r", rad );
	}
	function mousedblclick( event, node )	{

		let rad = degree_to_radius( node.degree, graph.max_degree );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "r", 2 * rad );
	}

	function dragstarted( event, node ) {

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) );
//		console.log( "drag start event subject: " + JSON.stringify( event.subject, null, 2 ) );
//		console.log( "drag start node: " + JSON.stringify( node, null, 2 ) );

		if ( !event.active )
			simulation.alphaTarget( 0.9 ).restart(); // range [ 0, 1 ]
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}
	function dragging( event, node ) {

		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}
	function dragended( event, node ) {

		if ( !event.active )
			simulation.alphaTarget ( 0 );
		event.subject.fx = null;
		event.subject.fy = null;
	}
}

///////////////////////////////////////////////////////////////////////

// https://observablehq.com/@d3/modifying-a-force-directed-graph

function mbostock_modify_graph( graph, width, height, plot_div_id )	{

	let svg = d3.select( "#" + plot_div_id )
		.append( "svg" )
//		.attr( "width", width ).attr( "height", height )
		.attr( "viewBox", [ -width / 2, -height / 2, width, height ] );

	const simulation = d3.forceSimulation()
		.force( "charge", d3.forceManyBody().strength( -70 ) )
		.force( "link", d3.forceLink() )
		.force( "x", d3.forceX() )
		.force( "y", d3.forceY() )
		.on( "tick", ticked );

	let link_group = svg.append( "g" )
		.attr( "stroke", d => "#000" )
		.attr( "stroke-opacity", d => 0.2 )
		.attr( "stroke-width", d => 2.0 )
		.selectAll( "line" );

	let node_group = svg.append( "g" )
		.attr( "stroke", d => "#000" )
		.attr( "stroke-width", 0.5 )
		.selectAll( "circle" );

	function ticked() {
		node_group
			.attr( "cx", d => d.x )
			.attr( "cy", d => d.y )

		link_group
			.attr( "x1", d => d.source.x )
			.attr( "y1", d => d.source.y )
			.attr( "x2", d => d.target.x )
			.attr( "y2", d => d.target.y );
	}

    function update_original( nodes, links ) {

		// Make a shallow copy to protect against mutation, while
		// recycling old nodes to preserve position and velocity.

		const old = new Map( node.data().map( d => [ d.id, d ] ) );
		nodes = nodes.map( d => Object.assign( old.get( d.id ) || {}, d ) );
		links = links.map( d => Object.assign( {}, d ) );

		node = node
			.data( nodes, d => d.id )
			.join(
				enter => enter.append( "circle" )
					.attr( "r", 5 )
					.attr( "fill", d => "#222" )
			);

		link = link
			.data( links, d => [ d.source, d.target ] )
			.join("line");

		simulation.nodes( nodes );
		simulation.force( "link" ).links( links );
		simulation.alpha( 0.2 ).restart();
    }
    function update_simulation() {

		simulation.stop();

		node_group = node_group
//			.data( graph.nodes, d => d.id )
			.data( graph.nodes )
			.join(

				enter => enter.append( "circle" )
					.attr( "r",
						d => degree_to_radius( d.degree, graph.max_degree )
					)
					.attr( "fill",
						d => d3.interpolateTurbo( degree_to_value( d.degree, graph.max_degree ) )
					)
				,
				update => update
					.attr( "r",
						d => degree_to_radius( d.degree, graph.max_degree )
					)
					.attr( "fill",
						d => d3.interpolateTurbo( degree_to_value( d.degree, graph.max_degree ) )
					)
			);

		link_group = link_group
//			.data( graph.links, d => [ d.source, d.target ] )
			.data( graph.links )
			.join( "line" );

		simulation.nodes( graph.nodes );
		simulation.force( "link" ).links( graph.links );
		simulation.alpha( 0.07 ).restart();
    }
    update_simulation();

	if( 0 )	{

		d3.interval( function() {
//		d3.timeout(function() {

//			if( 1 )	{	// add new
			if( Math.random() < 0.5 )	{	// add new

	// measure degree distribution: generate_stub_array( seq = [ ...deg(i) + 1, deg(i+1) + 1, ... )
	//		[ 0, 1, 2, 3... ] -> [ 1, 2, 3, 4... ]
	//  for hub over-representation
	//   pick stub randomly

// need to determine correct length/initialization...
				let stub_counts = new Array( graph.max_degree ).fill( 1 );


				for( let i=0; i< graph.nodes.length; i++ )	{
					stub_counts[ i ] = graph.nodes[ i ].degree + 1;
				}
//				console.log( stub_counts );

				let stubs = generate_stub_array( stub_counts );
//				console.log( stubs );

				let r_src = stubs[ rand_int_range( 0, stubs.length ) ];
				let r_tgt = stubs[ rand_int_range( 0, stubs.length ) ];

	// versus node-count picking:
//				let r_src = rand_int_range( 0, graph.nodes.length );
//				let r_tgt = rand_int_range( 0, graph.nodes.length );

//console.log( "nodes[ " + r_src + " ] " + JSON.stringify( graph.nodes[ r_src ], null, 2 ) );

//				if( 0 )	{
				if( r_src != r_tgt )	{

					if( true )	{ // check for duplicate here



						graph.nodes[ r_src ].degree += 1;
						graph.nodes[ r_tgt ].degree += 1;

	// choose copy method
	//					graph.links.push( { source: r_src, target: r_tgt } );
						graph.links.push( { source: graph.nodes[ r_src ], target: graph.nodes[ r_tgt ] } );

					}
				}
//				else { console.log( r_src, r_tgt ); }

			}
			else	{	// remove existing

				if( graph.links.length > 0 )	{

					let r_lnk = rand_int_range( 0, graph.links.length );

//console.log( "links[ " + r_lnk + " ] " + JSON.stringify( graph.links[ r_lnk ], null, 2 ) );

//					let s = graph.links[ r_lnk ].source;
//					let s = graph.links[ r_lnk ].source.id;
					let s = graph.links[ r_lnk ].source.index;
					graph.nodes[ s ].degree -= 1;

//console.log( JSON.stringify( graph.nodes[ s ], null, 2 ) );


//					let t = graph.links[ r_lnk ].target;
//					let t = graph.links[ r_lnk ].target.id;
					let t = graph.links[ r_lnk ].target.index;
					graph.nodes[ t ].degree -= 1;

//console.log( graph.nodes[ s ].degree, graph.nodes[ t ].degree );

					graph.links.splice( r_lnk, 1 );
				}
			}

			update_simulation();

		}, 1600 );
	}
}

///////////////////////////////////////////////////////////////////////

// https://bl.ocks.org/mbostock/4062045

function mbostock_force_graph( graph, width, height, plot_div_id )	{

	function print_graph() 	{

		console.log( "nodes: " + graph.nodes.length );
		console.log( "links: " + graph.links.length );

		for( let i=0; i< graph.nodes.length; i++ )	{
			console.log( graph.nodes[ i ].index );
		}
		for( let i=0; i< graph.links.length; i++ )	{

			// if(typeof val === 'object')

//			console.log( graph.links[ i ].source + " -> " + graph.links[ i ].target );
			console.log( graph.links[ i ].source.index + " -> " + graph.links[ i ].target.index );
		}
	}

	let svg = d3.select( "#" + plot_div_id )
		.append( "svg" )
//		.attr( "width", width )
//		.attr( "height", height )
//		.attr( "viewBox", [ -width / 2, -height / 2, width, height ] )
		.attr( "viewBox", [ -width, -height, 2 * width, 2 * height ] )
//		.attr( "viewBox", [ -width/2, -height/2, 2 * width, 2 * height ] ) // min-x, min-y, width and height
//		.attr( "style", "max-width: 100%; height: auto; height: intrinsic;" )
		;

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink() ) //.id( function(d) { return d.id; } ) )
//		.force("charge", d3.forceManyBody())
		.force( "charge", d3.forceManyBody().strength( -50.0 ) )
//		.force( "charge", d3.forceManyBody().strength( -40.0 ) )
		.force( "center", d3.forceCenter( 0, 0 ) )
		.force( "x", d3.forceX( 0 ) )
		.force( "y", d3.forceY( 0 ) )
		;

	let node = {};
	let link = {};

	function simulation_tick() {
		link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		node
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	}

	function degree_to_value( deg )	{
		return( 0.05 + 0.95 * deg / graph.max_degree );
	}

	function value_to_radius( v )	{
		return( 4 + 6 * v );
	}

	function degree_to_radius( deg )	{
		return( value_to_radius( degree_to_value( deg ) ) );
	}

	function initialize_links()	{

		link = svg.append( "g" )
			.attr( "stroke", "#000" )
			.attr( "stroke-opacity", 0.2 )
			.attr( "stroke-width", 1.5 )
			.attr( "stroke-linecap", "round" )
			.selectAll( "line" )
			.data( graph.links )
			.enter()
				.append( "line" )
				.attr( "stroke-width", function( d ) { return( 2.0 ); } )
			;
	}

	function initialize_nodes()	{

		node = svg.append("g")
			.attr( "class", "nodes" )
			.selectAll( "circle" )
			.data( graph.nodes )
			.enter()
				.append( "circle" )
	//			.attr( "id", function( d ) { return d.id; } ) // redundant?
				.attr( "r", function( d ) { return( degree_to_radius( d.degree ) ); } )
				.attr( "fill", function( d ) { return d3.interpolateTurbo( degree_to_value( d.degree) ); } )
				.on( "mousedown", mousedown )
	//			.on( "click", mouseclick )
				.on( "dblclick", mousedblclick )
	//			.on( "mouseover", mouseover )
	//			.on( "mouseout", mouseout )
				.call(
					d3.drag()
						.on( "start", dragstarted )
						.on( "drag", dragged )
						.on( "end", dragended )
				);
	}

	function initialize_sim()	{

		simulation
			.nodes( graph.nodes )
			.on( "tick", simulation_tick );

		simulation
			.force( "link" )
			.links( graph.links );

		simulation.alphaTarget( 0.1 ).restart();
	}

	initialize_links();
	initialize_nodes();
	initialize_sim();

	// http://bl.ocks.org/tgk/6068367
	// https://bl.ocks.org/mbostock/1095795
	// https://bl.ocks.org/colbenkharrl/21b3808492b93a21de841bc5ceac4e47
	// auto editing
	if( 0 )	{

		d3.interval( function() {
//		d3.timeout(function() {

			simulation.stop();

			link = link.data( graph.links ).remove();

			if( Math.random() < 0.5 )	{
				// add new

				let r_src = rand_int_range( 0, graph.nodes.length );
				let r_tgt = rand_int_range( 0, graph.nodes.length );

				graph.nodes[ r_src ].degree += 1;
				graph.nodes[ r_tgt ].degree += 1;

				graph.links.push( { source: r_src, target: r_tgt } );
//				graph.links.push( { source: graph.nodes[ r_src ], target: graph.nodes[ r_tgt ] } );
			}
			else	{
				// remove existing

				if( graph.links.length > 0 )	{

					let r_lnk = rand_int_range( 0, graph.links.length );

					let s = graph.links[ r_lnk ].source.index;
					graph.nodes[ s ].degree -= 1;

					let t = graph.links[ r_lnk ].target.index;
					graph.nodes[ t ].degree -= 1;

					graph.links.splice( r_lnk, 1 );
				}
			}

			initialize_links();

			node = node.data( graph.nodes ).remove();
			initialize_nodes();

			initialize_sim();

		}, 200 );
	}

	function mousedown( event, node )	{

//		console.log( "down: " + node.index + " : " + node.degree );
		let rad = degree_to_radius( node.degree );

		d3.select( this )
			.attr( "r", 2 * rad );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "r", rad );
	}

	function mouseclick( event, node )	{

//		console.log( "click: " + node.index + " : " + node.degree );
		let rad = degree_to_radius( node.degree );

		d3.select( this )
			.attr( "r", 2 * rad );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "r", rad );
	}

	function mousedblclick( event, node )	{

//		console.log( "double: " + node.index + " : " + node.degree );
		let rad = degree_to_radius( node.degree );

		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "r", 2 * rad );
	}

	function mouseover( event, node ) {

//		console.log( "over: " + node.index + " : " + node.degree );
		let rad = degree_to_radius( node.degree );

		d3.select( this )
			.transition()
			.duration( 500 )
			.attr( "r", 1.5 * rad );
	}

	function mouseout( event, node ) {

//		console.log( "out: " + node.index + " : " + node.degree );
		let rad = degree_to_radius( node.degree );

		d3.select( this )
			.transition()
			.duration( 500 )
			.attr( "r", rad );
	}

	function dragstarted( event, node ) {

//		console.log( "drag start: " + node.index + " : " + node.degree );

		if ( !event.active )
			simulation.alphaTarget( 0.9 ).restart(); // range [ 0, 1 ]
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}

	function dragged( event, node ) {

//		console.log( "dragging: " + node.index + " : " + node.degree );

		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}

	function dragended( event, node ) {

//		console.log( "drag end: " + node.index + " : " + node.degree );

		if ( !event.active )
			simulation.alphaTarget ( 0 );
		event.subject.fx = null;
		event.subject.fy = null;
	}
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// sample D3 Histogram utility:
// https://d3-graph-gallery.com/graph/histogram_basic.html

function simple_histogram( num_histo_buckets, data_arr, W, H )	{

	let margin = { top: 5, right: 5, bottom: 30, left: 20 },
		width = W - margin.left - margin.right,
		height = H - margin.top - margin.bottom;

	let svg = d3.select( "#" + histo_plot_id )
		.append( "svg" )
		.attr( "width", width + margin.left + margin.right )
		.attr( "height", height + margin.top + margin.bottom )
		.append( "g")
		.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

	let x = d3.scaleLinear()
		.domain( [ 0, num_histo_buckets ] )
		.range( [ 0, width ] );

	svg.append( "g" )
		.attr( "transform", "translate(0," + height + ")" )
		.call( d3.axisBottom( x ) );

	let histogram = d3.histogram()
		.value( function( element, index, data ) {
			return element;
		} )
		.domain( x.domain() )  // then the domain of the graphic
		.thresholds( x.ticks( num_histo_buckets ) ); // then the numbers of bins

	let bins = histogram( data_arr );

	// d3.hist has to be called before the Y axis obviously
	let y = d3.scaleLinear()
//		let y = d3.scaleLog() // nope
		.domain(
			[
				0,
				d3.max( bins, function(d) { return( d.length ); } )
			]
		)
		.range( [ height, 0 ] );

	svg.append( "g" )
		.call( d3.axisLeft( y ) );

	svg.selectAll("rect")
		.data( bins )
		.join( "rect" )
		.attr( "x", 1 )
		.attr( "transform", function( d ) {

//			return "translate(" + x( d.x0 - 0.5 ) + "," + y( d.length ) + ")";
			return "translate(" + x( d.x0 ) + "," + y( d.length ) + ")";
		} )
		.attr( "width", function( d ) {

			//console.log( d.x0, d.x1 );
			if( d.x1 > d.x0 )	{
				return x( d.x1 ) - x( d.x0 ) - 1 ;
			}
			return( 0 );
		} )
		.attr( "height", function( d ) {

			return height - y( d.length );
		} )
		.style( "fill", "#69b3a2");
}

///////////////////////////////////////////////////////////////////////

//https://observablehq.com/@bryangingechen/d3-log-scaled-histogram
function observablehq_log_histo( num_histo_buckets, data_arr )	{

	let width = 400;
	let height = 300;
//			let margin = ({top: 20, right: 20, bottom: 30, left: 40});
	let margin = { top: 10, right: 10, bottom: 30, left: 30 };

	let xAxis = g => g
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(x).tickSizeOuter(0))
		.call(g => g.append("text")
			.attr("x", width - margin.right)
			.attr("y", -4)
			.attr("fill", "#000")
			.attr("font-weight", "bold")
			.attr("text-anchor", "end")
			.text( "X" ));

	let yAxis = g => g
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(y))
		.call(g => g.select(".domain").remove())
		.call(g => g.select(".tick:last-of-type text").clone()
			.attr("x", 4)
			.attr("text-anchor", "start")
			.attr("font-weight", "bold")
			.text( "Y" ));

	let x = d3.scaleLinear()
		.domain(d3.extent( data_arr ).map((d,i) => i ? d+1 : d)).nice()
		.range([margin.left, width - margin.right]);

	let bins = d3.histogram()
		.domain(x.domain())
		.thresholds(x.ticks( num_histo_buckets ))
	  (data_arr)
		.filter(d => d.length !== 0);

	let y = d3.scaleLog()
		.domain(
			[ .1, d3.max( bins, d => d.length ) ]
		).nice()
		.range([height - margin.bottom, margin.top]);

//			const svg = d3.select(DOM.svg(width, height));
	let svg = d3.select( "#" + histo_plot_id )
		.append( "svg" )
		.attr( "width", width + margin.left + margin.right )
		.attr( "height", height + margin.top + margin.bottom )
		.append( "g")
		.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

	const bar = svg.append("g")
		  .attr("fill", "steelblue")
		.selectAll("rect")
		.data(bins)
		.enter().append("rect")
		  .attr("x", d => x(d.x0) + 1)
		  .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
		  .attr("y", d => y(d.length))
		  .attr("height", d => y.range()[0] - y(d.length));

	  svg.append("g")
		  .call(xAxis);

	  svg.append("g")
		  .call(yAxis);

}

///////////////////////////////////////////////////////////////////////

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/histogram
function Histogram(data, {
  value = d => d, // convenience alias for x
  domain, // convenience alias for xDomain
  label, // convenience alias for xLabel
  format, // convenience alias for xFormat
  type = d3.scaleLinear, // convenience alias for xType
  x = value, // given d in data, returns the (quantitative) x-value
  y = () => 1, // given d in data, returns the (quantitative) weight
  thresholds = 40, // approximate number of bins to generate, or threshold function
  normalize, // whether to normalize values to a total of 100%
  marginTop = 20, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 400, // outer width of chart, in pixels
  height = 300, // outer height of chart, in pixels
  insetLeft = 0.5, // inset left edge of bar
  insetRight = 0.5, // inset right edge of bar
  xType = type, // type of x-scale
  xDomain = domain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight], // [left, right]
  xLabel = label, // a label for the x-axis
  xFormat = format, // a format specifier string for the x-axis
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  yLabel = "↑ Frequency", // a label for the y-axis
  yFormat = normalize ? "%" : undefined, // a format specifier string for the y-axis
  color = "steelblue" // bar fill color
} = {}) {

  // Compute values.
  const X = d3.map(data, x);
  const Y0 = d3.map(data, y);
  const I = d3.range(X.length);

  // Compute bins.
  const bins = d3.bin().thresholds(thresholds).value(i => X[i])(I);
  const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]));
  if (normalize) {
	const total = d3.sum(Y);
	for (let i = 0; i < Y.length; ++i) Y[i] /= total;
  }

  // Compute default domains.
  if (xDomain === undefined) xDomain = [bins[0].x0, bins[bins.length - 1].x1];
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
  yFormat = yScale.tickFormat(100, yFormat);

//		  const svg = d3.create("svg")
	let svg = d3.select( "#" + histo_plot_id )
		.append( "svg" )
	  .attr("width", width)
	  .attr("height", height)
	  .attr("viewBox", [0, 0, width, height])
	  .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
	  .attr("transform", `translate(${marginLeft},0)`)
	  .call(yAxis)
	  .call(g => g.select(".domain").remove())
	  .call(g => g.selectAll(".tick line").clone()
		  .attr("x2", width - marginLeft - marginRight)
		  .attr("stroke-opacity", 0.1))
	  .call(g => g.append("text")
		  .attr("x", -marginLeft)
		  .attr("y", 10)
		  .attr("fill", "currentColor")
		  .attr("text-anchor", "start")
		  .text(yLabel));

  svg.append("g")
	  .attr("fill", color)
	.selectAll("rect")
	.data(bins)
	.join("rect")
	  .attr("x", d => xScale(d.x0) + insetLeft)
	  .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
	  .attr("y", (d, i) => yScale(Y[i]))
	  .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
	.append("title")
	  .text((d, i) => [`${d.x0} ≤ x < ${d.x1}`, yFormat(Y[i])].join("\n"));

  svg.append("g")
	  .attr("transform", `translate(0,${height - marginBottom})`)
	  .call(xAxis)
	  .call(g => g.append("text")
		  .attr("x", width - marginRight)
		  .attr("y", 27)
		  .attr("fill", "currentColor")
		  .attr("text-anchor", "end")
		  .text(xLabel));
}

///////////////////////////////////////////////////////////////////////


