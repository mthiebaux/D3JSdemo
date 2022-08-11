
///////////////////////////////////////////////////////////////////////

function log_graph( graph, view )	{

	view.log( "LOG: " );
//	view.log( graph );

	view.log( "degrees: [ " + graph.degrees.join( ", " ) + " ]" );
	view.log( "map: " + JSON.stringify( [ ...( graph.map.entries() ) ] ) );
	for( let i=0; i< graph.nodes.length; i++ )	{
		view.log( "nodes: " + graph.nodes[ i ].id + " [ " + graph.nodes[ i ].adjacent.join( ", " ) + " ]" );
	}
	for( let i=0; i< graph.links.length; i++ )	{
		view.log( "links: [ " + graph.links[ i ].source.id + ", " + graph.links[ i ].target.id + " ]" );
	}
}

function create_graph_editor( view )	{

	let sim = create_simulation( view, 300, 300 );
	let graph = build_test_graph();
	let attr = attributes( 10 );

	sim.init( graph, attr );
	sim.update();

	let editor = {
		view,
		attr,
		graph,
		sim
	};
	return( editor );
}

function test_graph_editor( view )	{

	let editor = create_graph_editor( view );
	register_editor_events( editor );
}

///////////////////////////////////////////////////////////////////////

function attributes( max_degree )	{

	function ext( id )	{
		// extended_color_scheme # 32
		// https://github.com/d3/d3-scale-chromatic/blob/main/README.md
		let i = id % 32;
		if( i < 10 ) return( d3.schemeCategory10[ i ] );
		if( i < 20 ) return( d3.schemeTableau10[ i - 10 ] );
		return( d3.schemeSet3[ i - 20 ] );
	}
	function v2r( v )	{	// value to radius
		return( 4 + 8 * v );
	}
	function d2v( deg, max )	{ // degree_to_value
		return( 0.1 + deg / max );
	}
	function d2r( deg, max )	{ // degree to radius
		return( v2r( d2v( deg, max ) ) );
	}

	let attr = {

		node_border( node )	{
			if( node.group == 1 ) return( 3.0 );
			return( 1.0 );
		},
		node_radius( node )	{
			return( d2r( node.adjacent.length, max_degree ) );
		},
		node_color( node )	{
		//	if( node.group == 1 ) return(  );
		//	return( ext( node.id ) );
			return( d3.interpolateTurbo( d2v( node.adjacent.length, max_degree ) ) );
		},
		link_color( node )	{
			if( node.group == 1 ) return( "#000" );
			return( "#999" );
		},
		link_width( node )	{
			if( node.group == 1 ) return( 4.0 );
			return( 3.0 );
		}
	};
	return( attr );
}

function register_editor_events( editor )	{

	d3.select( editor.view.select( "simple" ) ).on(
		"mousedown",
		function( event )	{

			editor.graph = build_test_graph();
			editor.sim.init( editor.graph, editor.attr );
			editor.sim.update();
		}
	);
	d3.select( editor.view.select( "ring" ) ).on(
		"mousedown",
		function( event )	{

			editor.graph = build_ring_graph( 6, 1 );
			editor.sim.init( editor.graph, editor.attr );
			editor.sim.update();
		}
	);
	d3.select( editor.view.select( "chain" ) ).on(
		"mousedown",
		function( event )	{

			editor.graph = build_ring_graph( 12, 2 );
			editor.sim.init( editor.graph, editor.attr );
			editor.sim.update();
		}
	);

	function ungroup( arr )	{
		for( let i=0; i< arr.length; i++ )	{
			arr[ i ].group = 0;
		}
	}

	d3.select( editor.view.select( "links" ) ).on(
		"mousedown",
		function( event )	{

			ungroup( editor.graph.links );
			editor.sim.select_links = execute_graph_select_links( editor.graph, editor.sim.select_nodes );

			ungroup( editor.graph.nodes );
			editor.sim.select_nodes = [];
			editor.sim.update();
		}
	);
	d3.select( editor.view.select( "add" ) ).on(
		"mousedown",
		function( event )	{

			execute_graph_add( editor.graph, editor.sim.select_nodes );
			ungroup( editor.graph.links );
			ungroup( editor.graph.nodes );

			editor.sim.select_links = [];
			editor.sim.select_nodes = [];
			editor.sim.update();
		}
	);
	d3.select( editor.view.select( "del" ) ).on(
		"mousedown",
		function( event )	{

			execute_graph_delete( editor.graph, editor.sim.select_links, editor.sim.select_nodes );
			ungroup( editor.graph.links );
			ungroup( editor.graph.nodes );

			editor.sim.select_links = [];
			editor.sim.select_nodes = [];
			editor.sim.update();
		}
	);

	d3.select( editor.view.select( "print" ) ).on(
		"mousedown",
		function( event )	{

			log_graph( editor.graph, editor.view );
		}
	);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function build_node_map( nodes )	{

	let map = new Map();
	for( let i=0; i< nodes.length; i++ )	{
		map.set( nodes[ i ].id, i );
	}
	return( map );
}

function build_test_graph()	{

//	let max_degree = 10;
	let degrees = [ 1, 2, 1 ];
	let nodes = [
		{ id: 0, adjacent: [ 1 ], group: 0 },
		{ id: 1, adjacent: [ 0, 2 ], group: 0 },
		{ id: 2, adjacent: [ 1 ], group: 0 },
		{ id: 3, adjacent: [], group: 0 }
	];
	let map = build_node_map( nodes );
	let links = [
		{ source: 0, target: 1, group: 0 },
		{ source: 1, target: 2, group: 0 }
	];

	return {
//		max_degree,
		degrees,
		map,
		nodes,
		links
	};
}

function build_ring_graph( n, w )	{

//	let max_degree = 10;
	let degrees = new Array( n ).fill( 2 * w );

	let nodes = [];
	for( let i=0; i< n; i++ )	{
		nodes.push( { id: i, adjacent: [], group: 0 } );
	}
	let map = build_node_map( nodes );

	let links = [];
	for( let i=0; i< n; i++ )	{
		for( let j=0; j< w; j++ )	{

			let k = ( i + j + 1 ) % n;

			nodes[ i ].adjacent.push( k );
			nodes[ k ].adjacent.push( i );

			let [ s, t ] = [ i, k ].sort( ( a, b ) => a - b );
			links.push(
				{
					source: s,
					target: t,
					group: 0
				}
			);
		}
	}

	return {
//		max_degree,
		degrees,
		map,
		nodes,
		links
	};
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function execute_graph_select_links( graph, select_nodes )	{

	let set = new Set( [ ...select_nodes ] );
	let links = [];

	for( let i=0; i< graph.links.length; i++ )	{
		if( set.has( graph.links[ i ].source.index ) ||
			set.has( graph.links[ i ].target.index ) )	{

			links.push( i );
			graph.links[ i ].group = 1;
		}
	}
	return( links );
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
		graph.links.push( { source: s, target: t, group: 0 } );

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
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function create_simulation( view, width, height )	{

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
		view: view,
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

