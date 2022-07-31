
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

function expand_stub_array( seq )	{

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

function build_power_graph( num_nodes, min_degree, max_degree )	{

	let degree_sequence = new Array( num_nodes );
	for( let i=0; i< num_nodes; i++ )	{
		degree_sequence[ i ] = Math.floor( rand_pow_law( min_degree, max_degree + 1 ) );
	}

	let stubs = expand_stub_array( degree_sequence );
	let shuffled = shuffle_array_copy( stubs );
	let stub_list = balance_stub_array( shuffled );

	let adjacencies = [];
	for( let i=0; i< num_nodes; i++ )	{
		adjacencies[ i ] = [];
	}
	let edges = [];

	// stub pair matching, best effort
	// avoid self loops and double edges

	for( let i=0; i< num_nodes; i++ )	{

		let n = degree_sequence[ i ];	// node has n stubs
		let c = 0;				// stubs index

		while( ( c < stub_list.length ) && ( adjacencies[ i ].length < n ) )	{

			let p = stub_list[ c ];	// pairing candidate

			if( ( p >= 0 )&&( p != i ) )	{	// available and not self

				if( adjacencies[ p ].includes( i ) == false )	{ // not duplicate

					// store edge and adjacents
					let e = [ i, p ].sort( ( a, b ) => a - b ); // sort for undirected search

					edges.push( e );
					adjacencies[ i ].push( p );
					adjacencies[ p ].push( i );

					// invalidate both stubs
					stub_list[ c ] = -1;
					let found = false;
					for( let j=0; !found && ( j< stub_list.length ); j++ )	{

						if( stub_list[ j ] == i )	{ // remove first self stub found
							stub_list[ j ] = -1;
							found = true;
						}
					}
				}
			}
			c++;
		}
	}

	let graph_data = {
		max_degree: max_degree,
//		degrees: degree_sequence, // NO, may have been adjusted for balance
		degrees: [],
		nodes: [],
		links: []
	};

	for( let i=0; i< num_nodes; i++ )	{

		graph_data.degrees.push( adjacencies[ i ].length );

		graph_data.nodes.push(
			{
//				id: i, // redundant ?
				group: 0,
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

	return( graph_data );
}

///////////////////////////////////////////////////////////////////////

function build_test_graph()	{

	return {
		max_degree: 4,
		degrees: [ 1, 0, 2, 1 ],
//		degrees: [ 2, 1, 2, 1 ],
		nodes: [
			{ id: 0, adjacent: [ 2 ] },
			{ id: 1, adjacent: [  ] },
//			{ id: 0, adjacent: [ 1, 2 ] },
//			{ id: 1, adjacent: [ 0 ] },
			{ id: 2, adjacent: [ 3, 0 ] },
			{ id: 3, adjacent: [ 2 ] }
		],
		links: [
//			{ source: 0, target: 1 }, // sorted
			{ source: 2, target: 3 },
			{ source: 0, target: 2 }
		]
	};
}

function test_graph_sim( log_id, graph_id, histo_id )	{

	output_log_id = log_id;
	graph_plot_id = graph_id;
	histo_plot_id = histo_id;

//	let min_degree = 0.25;
//	let min_degree = 0.5;
	let min_degree = 0.9;
//	let min_degree = 1;
//	let min_degree = 2;
//	let min_degree = 4;
	let max_degree = 12;
	let num_nodes = 64;

	if( 0 )	{
		max_degree = 6;
		num_nodes = 32;
	}
	else
	if( 0 )	{
		max_degree = 8;
		num_nodes = 64;
	}
	else
	if( 1 )	{
		max_degree = 16;
		num_nodes = 128;
	}
	else
	if( 1 )	{
		max_degree = 20;
		num_nodes = 256;
	}

	let graph = {};

	if( 0 )	{
		graph = build_test_graph();
	} else {
		graph = build_power_graph( num_nodes, min_degree, max_degree );
	}

	let sim = create_simulation( 600, 600, graph_plot_id );
	let hist = create_histogram( 300, 100, histo_plot_id );
//	let hist = create_histogram( 300, 100, graph_plot_id );

	init_simulation( sim, hist, graph );
	init_histogram( hist, graph.degrees, graph.max_degree );

	d3.select( "#restart_button" ).on(
		"mousedown",
		function( event )	{

			let N = rand_int_range( num_nodes / 4, num_nodes * 2 );
			graph = build_power_graph( N, min_degree, max_degree );

			init_simulation( sim, hist, graph );
			init_histogram( hist, graph.degrees, graph.max_degree );
		}
	);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function execute_auto_edit( graph, reset_balance = false )	{

//  if( reset_balance ) console.log( "execute_auto_edit: reset_balance" );

	// static variable
    if( ( this.balance === undefined )|| reset_balance ) {
         this.balance = 0;
    }
	let edited = false;

	if( Math.random() < 0.5  )	{
		// remove existing link

		if( this.balance > -( graph.max_degree / 2 ) )	{

			if( graph.links.length > 0 )	{

				let r_link_id = rand_int_range( 0, graph.links.length );

				let src_id = graph.links[ r_link_id ].source.index;
				let tgt_id = graph.links[ r_link_id ].target.index;

				let src_adj_id = graph.nodes[ src_id ].adjacent.indexOf( tgt_id );
				let tgt_adj_id = graph.nodes[ tgt_id ].adjacent.indexOf( src_id );

			// update node adjacencies
				graph.nodes[ src_id ].adjacent.splice( src_adj_id, 1 );
				graph.nodes[ tgt_id ].adjacent.splice( tgt_adj_id, 1 );


			// this is a risky maneuver:
				graph.links.splice( r_link_id, 1 );


				graph.degrees[ src_id ] = graph.nodes[ src_id ].adjacent.length;
				graph.degrees[ tgt_id ] = graph.nodes[ tgt_id ].adjacent.length;;

				this.balance--;
				edited = true;
			}
		}
	}
	else	{
		// add new link

//		if( 1 )	{
		if( this.balance < ( graph.max_degree * 2 ) )	{

			let curr_max_deg = 0;
			for( let i=0; i< graph.nodes.length; i++ )	{

				let len = graph.nodes[ i ].adjacent.length;
				if( len > curr_max_deg ) curr_max_deg = len;
			}

			let stub_counts = [];
			for( let i=0; i< graph.nodes.length; i++ )	{

				stub_counts.push( graph.nodes[ i ].adjacent.length + 1 );
			}
			let stubs = expand_stub_array( stub_counts );

			let r_src_id = stubs[ rand_int_range( 0, stubs.length ) ];
			let r_tgt_id = stubs[ rand_int_range( 0, stubs.length ) ];

			if( r_src_id != r_tgt_id )	{

			// sort for undirected search
				[ r_src_id, r_tgt_id ] = [ r_src_id, r_tgt_id ].sort( ( a, b ) => a - b );

				if( graph.nodes[ r_src_id ].adjacent.includes( r_tgt_id ) == false )	{

					graph.nodes[ r_src_id ].adjacent.push( r_tgt_id );
					graph.nodes[ r_tgt_id ].adjacent.push( r_src_id );

				// choose copy method
//					graph.links.push( { source: r_src_id, target: r_tgt_id } );
					graph.links.push( { source: graph.nodes[ r_src_id ], target: graph.nodes[ r_tgt_id ] } );

					graph.degrees[ r_src_id ] = graph.nodes[ r_src_id ].adjacent.length;
					graph.degrees[ r_tgt_id ] = graph.nodes[ r_tgt_id ].adjacent.length;;

					this.balance++;
					edited = true;
				}
			}
		}
	}
	return( edited );
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

///////////////////////////////////////////////////////////////////////

function update_simulation( sim, graph )	{

// sim = { engine, nodes, links, ... };

	sim.engine.stop();

	sim.nodes = sim.nodes
		.data( graph.nodes )
		.join(
			enter => enter.append( "circle" )
				.on( "mousedown", mousedown_node )
//				.on( "click", mouseclick ) // down and up
				.on( "dblclick", mousedblclick_node )
//				.on( "mouseover", mouseover )
//				.on( "mouseout", mouseout )
				.call(
					d3.drag()
						.on( "start", dragstarted )
						.on( "drag", dragging )
						.on( "end", dragended )
				)
				.attr( "fill",
					d => d3.interpolateTurbo(
						degree_to_value( d.adjacent.length, graph.max_degree )
					)
				)
				.attr( "r", 0.0 )
				.transition().duration( 200 )
				.attr( "r",
					d => degree_to_radius( d.adjacent.length, graph.max_degree )
				)
				,
			update => update
				.attr( "r",
					d => degree_to_radius( d.adjacent.length, graph.max_degree )
				)
				.transition().duration( 200 )
				.attr( "fill",
					d => d3.interpolateTurbo(
						degree_to_value( d.adjacent.length, graph.max_degree )
					)
				)
		);

	sim.links = sim.links
		.data( graph.links )
		.join(
			enter => enter.append( "line" )
				.on( "mousedown", mousedown_link )
				.on( "dblclick", mousedblclick_link )
				.attr( "stroke-width", d => 0.0 )
				.attr( "stroke-opacity", d => 0.0 )
				.transition().duration( 1000 )
				.attr( "stroke-width", d => 2.0 )
				.attr( "stroke-opacity", d => 0.2 )

		);

	sim.engine.nodes( graph.nodes )
	sim.engine.force( "link" ).links( graph.links );
	sim.engine.alphaTarget( 0.1 ).restart();

	function mousedown_node( event, node )	{

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

//		console.log( "node index: " + node.index );

		let rad = degree_to_radius( node.adjacent.length, graph.max_degree );
		d3.select( this )
			.attr( "stroke-width", d => 4.0 )
			.attr( "r", 2 * rad )
			.transition()
			.duration( 1000 )
			.attr( "stroke-width", d => 1.0 )
			.attr( "r", rad );
	}
	function mousedblclick_node( event, node )	{

		let rad = degree_to_radius( node.adjacent.length, graph.max_degree );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "stroke-width", d => 0.0 )
			.attr( "r", 2 * rad );
	}
	function mousedown_link( event, link )	{

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down link: " + JSON.stringify( link, null, 2 ) );

		d3.select( this )
			.attr( "stroke-width", 8.0 );
		d3.select( this )
			.transition()
			.duration( 1000 )
			.attr( "stroke-width", 2.0 )
			.attr( "stroke-opacity", d => 0.2 )
			;
	}
	function mousedblclick_link( event, link )	{

		d3.select( this )
			.transition()
			.duration( 500 )
			.attr( "stroke", "#000" )
			.attr( "stroke-width", d => 5.0 )
			.attr( "stroke-opacity", d => 1.0 )
			;
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
		timeout: null,
		auto: false,
		ival: 1000,
		reset: true
	};
	return( sim );
}

function init_simulation( sim, hist, graph )	{

	sim.reset = true;
	if( sim.timeout ) sim.timeout.stop();
	if( sim.engine ) sim.engine.stop();
	if( sim.links ) sim.links.remove();
	if( sim.nodes ) sim.nodes.remove();

	sim.links = sim.svg.append( "g" )
		.attr( "stroke", d => "#000" )
//		.attr( "stroke-opacity", d => 0.2 ) // subject to transition
//		.attr( "stroke-width", d => 2.0 )
		.selectAll( "line" );

	sim.nodes = sim.svg.append( "g" )
		.attr( "stroke", d => "#000" )
		.attr( "stroke-width", 1.0 )
		.selectAll( "circle" );

	sim.engine = d3.forceSimulation()
		.force( "link", d3.forceLink() )
		.force( "charge", d3.forceManyBody().strength( -50 ) )
		.force( "center", d3.forceCenter( 0, 0 ) )
		.force( "x", d3.forceX( 0 ) )
		.force( "y", d3.forceY( 0 ) )
		.on( "tick",
			() => {
				sim.links
					.attr( "x1", d => d.source.x )
					.attr( "y1", d => d.source.y )
					.attr( "x2", d => d.target.x )
					.attr( "y2", d => d.target.y );
				sim.nodes
					.attr( "cx", d => d.x )
					.attr( "cy", d => d.y );
			}
		);

	update_simulation( sim, graph );

	function timeout_callback( d )	{

		let update = execute_auto_edit( graph, sim.reset );
		sim.reset = false;

		if( update == true )	{

			init_histogram( hist, graph.degrees, graph.max_degree );

			update_simulation( sim, graph );
		}
		if( sim.auto )	{

			sim.timeout = d3.timeout( timeout_callback, sim.ival );
		}
	}

	if( sim.auto )
		sim.timeout = d3.timeout( timeout_callback, sim.ival );

	d3.select( "#rate_slider" )
		.on( "input",
			function( event )	{

				function rate_conversion( i, max )	{
					return( 10 + 1000 * ( max - i ) / max );
				}

				if( this.value > 0 )	{

					if( sim.timeout ) sim.timeout.stop();

					sim.auto = true;
					sim.ival = rate_conversion( this.value, Number( this.max ) );
					sim.timeout = d3.timeout( timeout_callback, sim.ival );
				}
				else	{
					sim.auto = false;
				}
			}
		);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function create_histogram( width, height, histo_div_id )	{

	let svg = d3.select( "#" + histo_div_id )
		.append( "svg" )
		.attr( "width", width )
		.attr( "height", height );

	let hist = {
		svg,
		width,
		height,
		accum: [],
		xaxis: null,
		yaxis: null,
		path: null
	};
	return( hist );
}

function create_histogram_ticks( W, H, histo_div_id )	{

	let margin = { left: 30, right: 10, top: 5, bottom: 30 };
	let width = W - margin.left - margin.right;
	let height = H - margin.top - margin.bottom;

	let svg = d3.select( "#" + histo_div_id )
		.append( "svg" )
		.attr( "width", W )
		.attr( "height", H )
		.append( "g")
		.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

	let hist = {
		svg,
		width,
		height,
		accum: [],
		xaxis: null,
		yaxis: null,
		path: null
	};
	return( hist );
}

function accumulate_bins( bins, accum )	{


	while( accum.length < bins.length ) accum.push( 0 );

	for( let i=0; i< bins.length; i++ )	{
		accum[ i ] += bins[ i ].length;
	}
//console.log( accum );

	return( accum );
}

function init_histogram( hist, degrees, num_buckets )	{

	if( hist.xaxis ) hist.xaxis.remove();
	if( hist.yaxis ) hist.yaxis.remove();
	if( hist.path ) hist.path.remove();

	let X_scale = d3.scaleLinear()
		.domain( [ 0, num_buckets + 1 ] )
		.range( [ 0, hist.width ] );

	let histogram = d3.histogram()
		.value(
			function( element, index, data ) {
				return element;
			}
		)
		.domain( [ 0, num_buckets + 1 ] )
		.thresholds( num_buckets );

	let bins = histogram( degrees );

	let Y_scale = d3.scaleLinear()
		.domain( [ 0, d3.max( bins, (d) => d.length ) ] )
		.range( [ hist.height, 0 ] );

	hist.svg.selectAll( "rect" )
		.data( bins )
		.join( "rect" )
			.attr( "x", 1 )
			.attr( "transform",
				function( d ) {
					return "translate(" + X_scale( d.x0 ) + "," + Y_scale( d.length ) + ")";
				}
			)
			.attr( "width",
				function( d ) {
					if( d.x1 > d.x0 )	{
						return( X_scale( d.x1 ) - X_scale( d.x0 ) - 1 );
					}
					return( 0 );
				}
			)
			.attr( "height",
				function( d ) {
					return( hist.height - Y_scale( d.length ) );
				}
			)
			.attr( "fill",
				d => d3.interpolateTurbo(
					degree_to_value( d.length ? d[ 0 ] : 0, num_buckets )
				)
			);

	hist.accum = accumulate_bins( bins, hist.accum );

	let max = 1; // in case of no data
	for( let i=0; i< hist.accum.length; i++ )	{

		if( max < hist.accum[ i ] ) max = hist.accum[ i ];
	}

	let norm = [];
	for( let i=0; i< hist.accum.length; i++ )	{

		norm.push( [ i, hist.accum[ i ] / max ] );
	}

	hist.path = hist.svg.append( "path" )
        .datum( norm ) // single selection
			.attr( "class", "line" )
			.attr( "d", d3.line()
				.curve( d3.curveLinear )
				.x( d => X_scale( d[ 0 ] + 0.5 ) ) // mid top of bar, zero indexing
				.y( d => hist.height - d[ 1 ] * hist.height )
			)
			.attr( "fill", "none" )
			.attr( "stroke-dasharray", ( "2, 5" ) )
			.attr( "stroke", "#000" )
			.attr( "stroke-width", 2 );
}

function init_histogram_ticks( hist, degrees, num_buckets )	{

	if( hist.xaxis ) hist.xaxis.remove();
	if( hist.yaxis ) hist.yaxis.remove();
	if( hist.path ) hist.path.remove();

	let X_scale = d3.scaleLinear()
		.domain( [ 0, num_buckets + 1 ] )
//		.domain( [ -0.5, num_buckets + 0.5 ] )
		.range( [ 0, hist.width ] )
		;

if( 1 )	{
	hist.xaxis = hist.svg.append( "g" )
		.attr( "transform", "translate(0," + hist.height + ")" )
		.call( d3.axisBottom( X_scale ).ticks( 5 ) );
}

	let histogram = d3.histogram()
		.value(
			function( element, index, data ) {
				return element;
			}
		)
//		.domain( X_scale.domain() )  // then the domain of the graphic
		.domain( [ 0, num_buckets + 1 ] )
		.thresholds( num_buckets ); // X_scale.ticks( num_buckets ) ); // then the numbers of bins

//console.log( JSON.stringify( X_scale.domain(), null, 2 ) );

//console.log( degrees );
	let bins = histogram( degrees );
//console.log( bins );


	let Y_scale = d3.scaleLinear()
		.domain(
			[
				0,
				d3.max( bins, function(d) { return( d.length ); } )
			]
		)
		.range( [ hist.height, 0 ] );

if( 1 )	{
	hist.yaxis = hist.svg.append( "g" )
		.call( d3.axisLeft( Y_scale ).ticks( 5 ) );
}

	hist.svg.selectAll( "rect" )
		.data( bins )
		.join( "rect" )
		.attr( "x", 1 )
		.attr( "transform",
			function( d ) {
				return "translate(" + X_scale( d.x0 ) + "," + Y_scale( d.length ) + ")";
			}
		)
		.attr( "width",
			function( d ) {
				if( d.x1 > d.x0 )	{
					return( X_scale( d.x1 ) - X_scale( d.x0 ) - 1 );
				}
				return( 0 );
			}
		)
		.attr( "height",
			function( d ) {
				return( hist.height - Y_scale( d.length ) );
			}
		)
		.attr( "fill",
			d => d3.interpolateTurbo(
				degree_to_value( d.length ? d[ 0 ] : 0, num_buckets )
			)
		);

	hist.accum = accumulate_bins( bins, hist.accum );

	let max = 1; // in case of no data
	for( let i=0; i< hist.accum.length; i++ )	{

		if( max < hist.accum[ i ] ) max = hist.accum[ i ];
	}

	let norm = [];
	for( let i=0; i< hist.accum.length; i++ )	{

		norm.push( [ i, hist.accum[ i ] / max ] );
	}

	hist.path = hist.svg.append( "path" )
        .datum( norm ) // single selection
			.attr( "class", "line" )
			.attr( "d", d3.line()
				.curve( d3.curveLinear )
				.x( d => X_scale( d[ 0 ] + 0.5 ) )
				.y( d => hist.height - d[ 1 ] * hist.height )
			)
			.attr( "fill", "none" )
//			.attr( "stroke-dasharray", ( "3, 3" ) )
//			.attr( "stroke", "#bbb" )
//			.attr( "stroke-width", 3 );
			.attr( "stroke-dasharray", ( "2, 2" ) )
			.attr( "stroke", "#000" )
			.attr( "stroke-width", 2 );
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// sample D3 Histogram utility:
// https://d3-graph-gallery.com/graph/histogram_basic.html

function simple_histogram( data_arr, num_buckets, W, H )	{

//console.log( data_arr );

	let margin = { left: 30, right: 10, top: 5, bottom: 30 },
		width = W - margin.left - margin.right,
		height = H - margin.top - margin.bottom;

	let svg = d3.select( "#" + histo_plot_id )
		.append( "svg" )
		.attr( "width", W )
		.attr( "height", H )
		.append( "g")
		.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

	let X_axis = d3.scaleLinear()
		.domain( [ 0, num_buckets + 1 ] )
		.range( [ 0, width ] );

	svg.append( "g" )
		.attr( "transform", "translate(0," + height + ")" )
		.call( d3.axisBottom( X_axis ) );

	let histogram = d3.histogram()
		.value(
			function( element, index, data ) {
				return element;
			}
		)
		.domain( X_axis.domain() )  // then the domain of the graphic
		.thresholds( X_axis.ticks( num_buckets + 1 ) ); // then the numbers of bins

	let bins = histogram( data_arr );

//console.log( bins );

	// d3.hist has to be called before the Y axis obviously
	let Y_axis = d3.scaleLinear()
//	let Y_axis = d3.scaleLog() // nope
		.domain(
			[
				0,
				d3.max( bins, function(d) { return( d.length ); } )
			]
		)
		.range( [ height, 0 ] );

	svg.append( "g" )
		.call( d3.axisLeft( Y_axis ) );

	svg.selectAll("rect")
		.data( bins )
		.join( "rect" )
		.attr( "x", 1 )
		.attr( "transform", function( d ) {

//			return "translate(" + X_axis( d.x0 - 0.5 ) + "," + Y_axis( d.length ) + ")";
			return "translate(" + X_axis( d.x0 ) + "," + Y_axis( d.length ) + ")";
		} )
		.attr( "width", function( d ) {

			//console.log( d.x0, d.x1 );
			if( d.x1 > d.x0 )	{
				return( X_axis( d.x1 ) - X_axis( d.x0 ) - 1 );
			}
			return( 0 );
		} )
		.attr( "height", function( d ) {

			return( height - Y_axis( d.length ) );
		} )
		.style( "fill", "#69b3a2");
}

///////////////////////////////////////////////////////////////////////

// https://observablehq.com/@bryangingechen/d3-log-scaled-histogram

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
   yLabel = "+ Frequency", // a label for the y-axis
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
	  .text((d, i) => [`${d.x0} ² x < ${d.x1}`, yFormat(Y[i])].join("\n"));

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


