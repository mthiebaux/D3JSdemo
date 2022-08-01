
function test_graph_sim( graph_plot_id )	{

	let graph = {
		nodes: [ { index: 0 }, { index: 1 } ],
		links: []
	};

	let sim = create_simulation( 300, 150, graph_plot_id );
	init_simulation( sim, graph );

	d3.timeout(
		function()	{

			alert( "deleting node" );

			let i = 1;
			graph.nodes.splice( i, 1 );
			update_simulation( sim, graph );

		}, 1000
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
		links: null
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
					.attr( "x1", d => d.source.x )
					.attr( "y1", d => d.source.y )
					.attr( "x2", d => d.target.x )
					.attr( "y2", d => d.target.y );
				sim.nodes
					.attr( "cx", d => d.x ) // bug appears here !!
					.attr( "cy", d => d.y )
//					.attr( "cx", d => ( 0 + d.x ) ) // bug appears here !!
//					.attr( "cy", d => ( 0 + d.y ) )

//					.attr( "cx", d => ( d.x + 0.000000001 ) ) // fixed!
//					.attr( "cy", d => ( d.y + 0.000000001 ) )
//					.attr( "cx", d => d.x.toFixed( 100 ) )
//					.attr( "cy", d => d.y.toFixed( 100 ) ) // Safari browser patch
				;
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
		.join();

	sim.engine.nodes( graph.nodes )
	sim.engine.force( "link" ).links( graph.links );
	sim.engine.alphaTarget( 0.1 ).restart();

	function dragstarted( event, node ) {

		console.log( "dragstarted: ", event.subject.x );

		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}
	function dragging( event, node ) {
	}
	function dragended( event, node ) {

		event.subject.fx = null;
		event.subject.fy = null;
	}
}

