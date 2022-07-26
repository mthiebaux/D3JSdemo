
//import * as d3 from 'https://unpkg.com/d3?module' // slower to load?

import * as d3 from "https://cdn.skypack.dev/d3@7"; // GitHub recommended

import * as simulation from './simulation.js';
import * as histogram from './histogram.js';

import * as graph_gen from './graph_gen.js';
import * as graph_edit from './graph_edit.js';
import * as graph_algo from './graph_algo.js';

export { create };

///////////////////////////////////////////////////////////////////////

function create( view_elements )	{

	let app = {

		view:	view_handlers( view_elements ),
		attr:	null,
		graph:	null,
		sim:	null,
		histo:	null,

		max_degree:		10,
		select_nodes:	[], // ephemeral: stored temporarily by index, not id
		select_links:	[],

		auto_search:	false,
//		path_search:	0, // 0: none, 1: BFS, 2:DFL, 3: Dmin, 4: Dmax
//		auto_path:	false, // deprecate
		auto_edit:	false,
		timeout:	null,
		ival:		1000,

		init()	{
			init_editor( this );
		},
		reset()	{
			reset_editor( this ); // for client changes
		}
	};
	return( app );
}

function init_editor( app )	{

	register_reset_handlers( app );
	register_event_handlers( app );

	if( app.attr == null )
		app.attr = attribute_handlers( app );

	if( app.graph == null )
		app.graph = graph_gen.simple_graph();

	if( app.sim == null )
		app.sim = simulation.create( app.view, 300, 300 );

	app.sim.select = selection_handlers( app ); // defaults to no-op
	app.sim.init( app.graph, app.attr );
	app.sim.update();

	if( app.histo == null )
		app.histo = histogram.create( app.view, app.attr, 300, 50 );

	app.histo.update( app.graph, app.max_degree, true );
}

///////////////////////////////////////////////////////////////////////

function view_handlers( view_elements )	{

	return {

		select( id )	{

			if( view_elements[ id ] !== undefined )	{
				return( "#" + view_elements[ id ] );
			}
			return( null );
		},

		log_str( str )	{

			let elem_name = view_elements[ "log" ];
			if( elem_name )	{

				let log_area = document.getElementById( elem_name );
				log_area.value += str;
				log_area.value += '\n';
				log_area.scrollTop = log_area.scrollHeight;
			}
		},

		log( input )	{

			if( typeof input === "string" )	{
				this.log_str( input );
			}
			else	{
				this.log_str( JSON.stringify( input, null, 2 ) );
			}
		}
	};
}

function attribute_handlers( app )	{

	function ext( id )	{
		// extended_color_scheme # 32
		// https://github.com/d3/d3-scale-chromatic/blob/main/README.md
		let i = id % 32;
		if( i < 10 ) return( d3.schemeCategory10[ i ] );
		if( i < 20 ) return( d3.schemeTableau10[ i - 10 ] );
		return( d3.schemeSet3[ i - 20 ] );
	}
	function v2r( v )	{	// value to radius
		return( 4 + 6 * v );
	}
	function d2v( deg, max )	{ // degree_to_value
		return( 0.1 + deg / max );
	}
	function d2r( deg, max )	{ // degree to radius
		return( v2r( d2v( deg, max ) ) );
	}

	let attr = {

		bin_color( degree )	{

			return( d3.interpolateTurbo( d2v( degree, app.max_degree ) ) );
		},
		node_border( node )	{

			if( node.group > 0 ) return( 0.4 * d2r( node.adjacent.length, app.max_degree ) );
			return( 0 );
		},
		node_border_color( node )	{

			if( node.group == 2 ) return( "#aaa" );
			return( "#000" );
		},
		node_radius( node )	{

			return( d2r( node.adjacent.length, app.max_degree ) );
		},
		node_color( node )	{

//			return( ext( node.id ) );
			return( this.bin_color( node.adjacent.length ) );
		},
		link_color( link )	{

			if( link.group == 1 ) return( "#000" );
			return( "#aaa" );
		},
		link_width( link )	{

			if( link.group == 1 ) return( 4.0 );
			return( 3.0 );
		}
	};
	return( attr );
}

function selection_handlers( app )	{

	function mousedown_node( event, node )	{

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down node: " + JSON.stringify( node, null, 2 ) );

		let arr_i = app.select_nodes.indexOf( node.index );
		if( arr_i == -1 )	{

			app.select_nodes.push( node.index );
			node.group = 1;
		}
		else	{ // de-select

			app.select_nodes.splice( arr_i, 1 );
			node.group = 0;
		}

		app.sim.update();
		app.view.log( "node: " + node.id + " [ " + node.adjacent.join( ", " ) + " ] " + node.index );
	}

	function mousedown_link( event, link )	{

//		console.log( "down event: " + JSON.stringify( event, null, 2 ) ); // bupkis
//		console.log( "down link: " + JSON.stringify( link, null, 2 ) );

		let arr_i = app.select_links.indexOf( link.index );
		if( arr_i == -1 )	{

			app.select_links.push( link.index );
			link.group = 1;
		}
		else	{ // de-select

			app.select_links.splice( arr_i, 1 );
			link.group = 0;
		}

		app.sim.update();
		app.view.log( "link: [ " + link.source.id + ", " + link.target.id + " ] " + link.index );
	}

	return( { mousedown_node, mousedown_link } );
}

///////////////////////////////////////////////////////////////////////

function register_reset_handlers( app )	{

	d3.select( app.view.select( "simple" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 10;
			app.graph = graph_gen.simple_graph();
			app.reset();
		}
	);
	d3.select( app.view.select( "ring" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 10;
			app.graph = graph_gen.ring_graph( 12, 1 );
			app.reset();
		}
	);
	d3.select( app.view.select( "chain" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 15;
			app.graph = graph_gen.ring_graph( 18, 3 );
			app.reset();
		}
	);
	d3.select( app.view.select( "power" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 20;
			let num_nodes = 42;
			let N = graph_gen.rand_int_range( num_nodes * 0.5, num_nodes * 1.5 );
			app.graph = graph_gen.power_graph( N, 0.9, app.max_degree );
			app.reset();
		}
	);
}

function register_event_handlers( app )	{

	d3.select( app.view.select( "stop" ) ).on(
		"mousedown",
		function( event )	{

			d3.select( app.view.select( "rate" ) ).property( "value", 0 );
			update_auto_edit( app, 0 );

			d3.select( app.view.select( "search" ) ).property( "checked", false );
			app.path_search = 0;
			app.auto_search = false;
//			app.auto_path = false;

			ungroup_elems( app.graph.links );
			ungroup_elems( app.graph.nodes );
			app.select_links = [];
			app.select_nodes = [];
			app.sim.update();
		}
	);

	d3.select( app.view.select( "bfs" ) ).on(
		"mousedown",
		function( event )	{

			app.path_search = 1;
			update_path_search( app );
		}
	);
	d3.select( app.view.select( "djk" ) ).on(
		"mousedown",
		function( event )	{

			app.path_search = 2;
			update_path_search( app );
		}
	);
	d3.select( app.view.select( "djk_test" ) ).on(
		"mousedown",
		function( event )	{

/*

	0 --- 1 --- 2
	|  /  |  /
	3 --- 4

*/
			let W = [ 6, 1, 5, 2, 2, 5, 1 ];

			console.log( "weight:" );
			for( let i=0; i< W.length; i++ )	{
				console.log( i + ": " + W[ i ] );
			}

			let path_nodes = graph_algo.path_search_Dijkstra( app.graph, W, 0, 2 );
//			let path_nodes = graph_algo.path_search_Dijkstra( app.graph, W, 100, 102 );

			console.log( "path:" );
			for( let i=0; i< path_nodes.length; i++ )	{
				console.log( path_nodes[ i ] );
			}

		}
	);
	d3.select( app.view.select( "dmin" ) ).on(
		"mousedown",
		function( event )	{

			app.path_search = 3;
			update_path_search( app );
		}
	);
	d3.select( app.view.select( "dmax" ) ).on(
		"mousedown",
		function( event )	{

			app.path_search = 4;
			update_path_search( app );
		}
	);
	d3.select( app.view.select( "auto" ) ).on(
		"change",
		function( event )	{

			app.auto_search = event.target.checked;
//			app.auto_path = event.target.checked;
		}
	);

	d3.select( app.view.select( "links" ) ).on(
		"mousedown",
		function( event )	{

			ungroup_elems( app.graph.links );
			app.select_links = graph_edit.collect_links( app.graph, app.select_nodes );
			for( let i of app.select_links )	{
				app.graph.links[ i ].group = 1;
			}

			ungroup_elems( app.graph.nodes );
			app.select_nodes = [];
			app.sim.update();
		}
	);
	d3.select( app.view.select( "add" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.add_elems( app.graph, app.select_nodes );
			ungroup_elems( app.graph.links );
			ungroup_elems( app.graph.nodes );

			app.select_links = [];
			app.select_nodes = [];
			app.sim.update();
			app.histo.update( app.graph, app.max_degree, false );
		}
	);
	d3.select( app.view.select( "del" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.delete_elems( app.graph, app.select_links, app.select_nodes );
			ungroup_elems( app.graph.links );
			ungroup_elems( app.graph.nodes );

			app.select_links = [];
			app.select_nodes = [];
			app.sim.update();
			app.histo.update( app.graph, app.max_degree, false );
		}
	);

	d3.select( app.view.select( "rate" ) ).on(
		"input",
		function( event )	{

			update_auto_edit( app, this.value, this.max );
		}
	);

	d3.select( app.view.select( "print" ) ).on(
		"mousedown",
		function( event )	{

			log_graph( app.graph, app.view );
		}
	);
}

///////////////////////////////////////////////////////////////////////

function reset_editor( app )	{

	app.select_links = [];
	app.select_nodes = [];
	app.sim.init( app.graph, app.attr );
	app.sim.update();
	app.histo.update( app.graph, app.max_degree, true );
}

function ungroup_elems( arr )	{

	for( let i=0; i< arr.length; i++ )	{
		arr[ i ].group = 0;
	}
}

function execute_auto_search( app, fr_id, to_id )	{

	if( app.path_search == 1 )	{
		return( graph_algo.path_search_BFS( app.graph, fr_id, to_id ) );
	}
	else
	if( app.path_search == 2 )	{
		let weights = new Array( app.graph.links.length ).fill( 1 );
		return( graph_algo.path_search_Dijkstra( app.graph, weights, fr_id, to_id ) );
	}
	else
	if( app.path_search == 3 )	{
		let weights = graph_algo.generate_link_weights( app.graph, 0 );
		return( graph_algo.path_search_Dijkstra( app.graph, weights, fr_id, to_id ) );
	}
	else
	if( app.path_search == 4 )	{
		let weights = graph_algo.generate_link_weights( app.graph, 10 );
		return( graph_algo.path_search_Dijkstra( app.graph, weights, fr_id, to_id ) );
	}
	return( [] );
}

function update_path_search( app )	{

	// convert node id to array index
	const index = ( id ) => app.graph.map.get( id );

	ungroup_elems( app.graph.nodes );
	ungroup_elems( app.graph.links );

	let len = app.select_nodes.length;
	if( len > 1 )	{

		// first and last:
		let fr_id = app.graph.nodes[ app.select_nodes[ 0 ] ].id;
		let to_id = app.graph.nodes[ app.select_nodes[ len - 1 ] ].id;

		let path_nodes = execute_auto_search( app, fr_id, to_id );

		let fr_i = index( fr_id );
		let to_i = index( to_id );
		app.select_nodes = [ fr_i, to_i ];
		app.graph.nodes[ fr_i ].group = 1;
		app.graph.nodes[ to_i ].group = 1;

		for( let i = 1; i < path_nodes.length - 1; i++ )	{
			app.graph.nodes[ index( path_nodes[ i ] ) ].group = 2;
		}

		let path_links = graph_algo.find_path_links( app.graph, path_nodes );

		app.select_links = [];
		for( let i of path_links )	{
			app.select_links.push( i );
			app.graph.links[ i ].group = 1;
		}

		app.sim.update();
	}
}

function update_auto_edit( app, value, slider_max )	{

	if( value > 0 )	{

		function mutate_timeout_callback( d )	{

			let update = graph_edit.auto_edit_links( app.graph, app.max_degree );
			if( update == true )	{
				app.sim.update();
				app.histo.update( app.graph, app.max_degree, false );
			}
			if( app.auto_search )	{
				update_path_search( app );
			}
			if( app.auto_edit )	{
				app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
			}
		}

		function msec_rate_conversion( i, max )	{
			if( i >= max ) return( 1 );
			return( 10 + 1000 * ( max - i ) / max );
		}

		if( app.timeout ) app.timeout.stop();
		app.auto_edit = true;
		app.ival = msec_rate_conversion( value, Number( slider_max ) );
		app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
	}
	else	{
		app.auto_edit = false;
	}
}

function log_graph( graph, view )	{

	view.log( "GRAPH: " );
//	view.log( graph );

	view.log( "map: " + JSON.stringify( [ ...( graph.map.entries() ) ] ) );
	for( let i=0; i< graph.nodes.length; i++ )	{
		view.log( "nodes: " + graph.nodes[ i ].id + " [ " + graph.nodes[ i ].adjacent.join( ", " ) + " ]" );
	}
	for( let i=0; i< graph.links.length; i++ )	{
		view.log( "links: [ " + graph.links[ i ].source.id + ", " + graph.links[ i ].target.id + " ]" );
	}
}

///////////////////////////////////////////////////////////////////////
