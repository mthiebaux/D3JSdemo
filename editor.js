
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

function build_ring_graph_naked( n, w )	{

	let N = [];
	for( let i=0; i< n; i++ )	{
		N.push( {} );
	}
	let L = [];

	for( let i=0; i< n; i++ )	{
		for( let j=0; j< w; j++ )	{

			let k = ( i + j + 1 ) % n;

			let [ s, t ] = [ i, k ].sort( ( a, b ) => a - b );
			L.push( { source: s, target: t } );
		}
	}

	return {
		nodes: N,
		links: L
	};
}

function build_ring_graph( n, w )	{

	let D = new Array( n ).fill( 2 * w );

	let N = [];
	for( let i=0; i< n; i++ )	{
		N.push( { adjacent: [] } );
	}
	let L = [];

	for( let i=0; i< n; i++ )	{
		for( let j=0; j< w; j++ )	{

			let k = ( i + j + 1 ) % n;

			N[ i ].adjacent.push( k );
			N[ k ].adjacent.push( i );

			let [ s, t ] = [ i, k ].sort( ( a, b ) => a - b );
			L.push( { source: s, target: t } );
		}
	}

	return {
		max_degree: 20,
		degrees: D,
		nodes: N,
		links: L
	};
}

function build_ring_graph_expanded( n, w )	{

	let D = new Array( n ).fill( 2 * w );

	let N = [];
	for( let i=0; i< n; i++ )	{
		N.push( { adjacent: [], index: i } );
	}
	let L = [];

	for( let i=0; i< n; i++ )	{
		for( let j=0; j< w; j++ )	{

			let k = ( i + j + 1 ) % n;

			N[ i ].adjacent.push( k );
			N[ k ].adjacent.push( i );

			let [ s, t ] = [ i, k ].sort( ( a, b ) => a - b );
			L.push( { source: N[ s ], target: N[ t ], index: i } );
		}
	}

	return {
		max_degree: 20,
		degrees: D,
		nodes: N,
		links: L
	};
}

///////////////////////////////////////////////////////////////////////

function print_graph_naked( G )	{

	for( let i=0; i< G.nodes.length; i++ )	{
		console.log( "nodes: " + i + " : " + JSON.stringify( G.nodes[ i ] ) );
	}
	for( let i=0; i< G.links.length; i++ )	{
		console.log( "links: " + i + " [ " + G.links[ i ].source + ", " + G.links[ i ].target + " ]" );
	}
}

function print_graph( G )	{

//	console.log( "degrees: [ " + G.degrees + " ]" );

	for( let i=0; i< G.nodes.length; i++ )	{
		console.log( "nodes: " + i + " [ " + G.nodes[ i ].adjacent + " ]" );
	}
	for( let i=0; i< G.links.length; i++ )	{
		console.log( "links: " + i + " [ " + G.links[ i ].source + ", " + G.links[ i ].target + " ]" );
	}
}

function print_graph_expanded( G )	{

//	console.log( "degrees: [ " + G.degrees + " ]" );

	for( let i=0; i< G.nodes.length; i++ )	{
//		console.log( "nodes: " + i + " [ " + G.nodes[ i ].adjacent + " ] " + G.nodes[ i ].index );
		console.log( "nodes: " + i + " : " + G.nodes[ i ].index );
	}
	for( let i=0; i< G.links.length; i++ )	{
		console.log( "links: " + i + " [ " + G.links[ i ].source.index + ", " + G.links[ i ].target.index + " ] " + G.links[ i ].index );
	}
}

///////////////////////////////////////////////////////////////////////

function test_graph_sim( log_id, graph_plot_id )	{

	output_log_id = log_id;

	let graph = {};
	if( 1 )	{
		graph = build_ring_graph_naked( 12, 2 );
//		graph = build_ring_graph_naked( 2, 0 );
		print_graph_naked( graph );
	}
	else
	if( 1 )	{
		graph = build_ring_graph( 3, 1 );
		print_graph( graph );
	}
	else	{
		graph = build_ring_graph_expanded( 3, 1 );
		print_graph_expanded( graph );
	}

	let sim = create_simulation( 300, 150, graph_plot_id );

	init_simulation( sim, graph );

	d3.select( "#restart_button" ).on(
		"mousedown",
		function( event )	{

			graph = build_ring_graph( 3, 1 );

			init_simulation( sim, graph );
		}
	);

	d3.select( "#print_button" ).on(
		"mousedown",
		function( event )	{

//			console.log( JSON.stringify( graph, null, 2 ) );
//			print_graph_naked( graph );
//			print_graph( graph );
			print_graph_expanded( graph );
		}
	);
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

	sim.engine = d3.forceSimulation()
		.force( "link", d3.forceLink() )
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

function update_simulation( sim, graph )	{

	sim.engine.stop();

	sim.nodes = sim.nodes
		.data( graph.nodes )
		.join(
			enter => enter.append( "circle" )
				.attr( "fill", d => "#48f" )
				.attr( "stroke", d => "#000" )
				.attr( "stroke-width", d => 1.0 )
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
			,
			exit => exit
				.remove()
		);

	sim.links = sim.links
		.data( graph.links )
		.join(
			enter => enter.append( "line" )
				.attr( "stroke", d => "#777" )
				.attr( "stroke-width", d => 2.0 )
				.on( "mousedown", mousedown_link )
			,
			update => update
				.attr( "stroke", d => "#777" )
				.attr( "stroke-width", d => 2.0 )
			,
			exit => exit
				.remove()
		);

	sim.engine.nodes( graph.nodes )
	sim.engine.force( "link" ).links( graph.links );
	sim.engine.alphaTarget( 0.1 ).restart();


	d3.select( "#action_button" ).on(
		"mousedown",
		function( event )	{

			// delete selected links first, and then nodes

			if( sim.select_link >= 0 )	{

				graph.links.splice( sim.select_link, 1 );
				sim.select_link = -1;

				update_simulation( sim, graph );
			}

			if( sim.select_node >= 0 )	{

				let remove = [];
				for( let i=0; i< graph.links.length; i++ )	{
					if(
						graph.links[ i ].source.index == sim.select_node ||
						graph.links[ i ].target.index == sim.select_node
					)	{
						remove.push( i );
					}
				}
				// start from far end for multiple splice

				for( let i= remove.length - 1; i >= 0; i-- )	{
					graph.links.splice( remove[ i ], 1 );
				}

				graph.nodes.splice( sim.select_node, 1 );
				sim.select_node = -1;

				update_simulation( sim, graph );
			}
		}
	);


	function mousedown_node( event, node )	{ //// NODE

//		console.log( "drag start event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

		if( sim.select_node == node.index )	{

			d3.select( this )
				.attr( "stroke-width", 1.0 );

			sim.select_node = -1;
			return;
		}

		sim.select_link = -1;
		sim.links
			.attr( "stroke", "#777" )
			.attr( "stroke-width", 2.0 );

		sim.nodes
			.attr( "stroke-width", 1.0 );
		d3.select( this )
			.attr( "stroke-width", d => 2.0 )

		log( node );
		clog( node );
		log( "node: " + node.index );
		clog( "node: " + node.index );
		console.log( "node: " + node.index );
		sim.select_node = node.index;
	}

	function mousedown_link( event, link )	{ //// LINK

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down link: " + JSON.stringify( link, null, 2 ) );
//		console.log( this );

		if( sim.select_link == link.index )	{

			d3.select( this )
				.attr( "stroke", "#777" )
				.attr( "stroke-width", 2.0 );

			sim.select_link = -1;
			return;
		}

		sim.select_node = -1;
		sim.nodes
			.attr( "stroke-width", 1.0 );

		sim.links
			.attr( "stroke", "#777" )
			.attr( "stroke-width", 2.0 );
		d3.select( this )
			.attr( "stroke", "#000" )
			.attr( "stroke-width", 4.0 );

		log( "link: " + link.index + " [ " + link.source.index + ", " + link.target.index + " ]" );
		console.log( "link: " + link.index + " [ " + link.source.index + ", " + link.target.index + " ]" );
		sim.select_link = link.index;
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

