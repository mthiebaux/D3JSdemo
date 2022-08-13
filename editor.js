
//import * as d3 from 'https://unpkg.com/d3?module' // slower to load?

import * as d3 from "https://cdn.skypack.dev/d3@7"; // GitHub recommended

import * as graph_gen from './graph_gen.js';
import * as graph_edit from './graph_edit.js';
import * as simulation from './simulation.js';
import * as histogram from './histogram.js';

export { init };

///////////////////////////////////////////////////////////////////////

function init( view_elements )	{

	const view = {

		select( id )	{
			return( "#" + view_elements[ id ] );
		},
		log_str( str )	{
			let log_area = document.getElementById( view_elements[ "log" ] );
			log_area.value += str;
			log_area.value += '\n';
			log_area.scrollTop = log_area.scrollHeight;
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

	let graph = graph_gen.simple_graph();
	let sim = simulation.create( view, 300, 300 );

	let app = {

		view,
		graph,
		sim,

		histo: null,
		attr: null,

		max_degree: 10,
		select_nodes: [], // ephemeral: stored temporarily by index, not id
		select_links: [],

		timeout: null,
		auto: false,
		ival: 1000,
		reset: true // auto-edit balance reset:
	};

	app.attr = attribute_handlers( app );
	register_reset_handlers( app );
	register_event_handlers( app );

	app.sim.select = selection_handlers( app );
	app.sim.init( graph, app.attr );
	app.sim.update();

	app.histo = histogram.create( view, app.attr, 300, 50 );
	app.histo.update( graph.degrees, app.max_degree, true );
}

///////////////////////////////////////////////////////////////////////

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
		return( 4 + 8 * v );
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

// 			if( node.group == 1 ) return( 5.0 );
// 			return( 2.0 );

			if( node.group == 1 ) return( 0.5 * d2r( node.adjacent.length, app.max_degree ) );
//			return( 0.2 * d2r( node.adjacent.length, app.max_degree ) );
			return( 0 );
		},
		node_border_color( node )	{
//			return( this.bin_color( node.adjacent.length ) );
//			return( ext( node.id ) );
			return( "#000" );
		},
		node_radius( node )	{
			return( d2r( node.adjacent.length, app.max_degree ) );
		},
		node_color( node )	{
		//	if( node.group == 1 ) return(  );
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

///////////////////////////////////////////////////////////////////////

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

	function reset()	{
		app.reset = true;
		app.sim.init( app.graph, app.attr );
		app.sim.update();
		app.histo.update( app.graph.degrees, app.max_degree, true );
	}

	d3.select( app.view.select( "simple" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 10;
			app.graph = graph_gen.simple_graph();
			reset();
		}
	);
	d3.select( app.view.select( "ring" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 10;
			app.graph = graph_gen.ring_graph( 12, 1 );
			reset();
		}
	);
	d3.select( app.view.select( "chain" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 15;
			app.graph = graph_gen.ring_graph( 18, 3 );
			reset();
		}
	);
	d3.select( app.view.select( "power" ) ).on(
		"mousedown",
		function( event )	{

			app.max_degree = 20;
			let num_nodes = 42;
			let N = graph_gen.rand_int_range( num_nodes * 0.5, num_nodes * 1.5 );
			app.graph = graph_gen.power_graph( N, 0.9, app.max_degree );
			reset();
		}
	);
}

function register_event_handlers( app )	{

	function ungroup( arr )	{
		for( let i=0; i< arr.length; i++ )	{
			arr[ i ].group = 0;
		}
	}

	d3.select( app.view.select( "links" ) ).on(
		"mousedown",
		function( event )	{

			ungroup( app.graph.links );
			app.select_links = graph_edit.collect_links( app.graph, app.select_nodes );
			for( let i of app.select_links )
				app.graph.links[ i ].group = 1;

			ungroup( app.graph.nodes );
			app.select_nodes = [];

			app.sim.update();
			app.histo.update( app.graph.degrees, app.max_degree, false );
		}
	);
	d3.select( app.view.select( "add" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.add_elems( app.graph, app.select_nodes );
			ungroup( app.graph.links );
			ungroup( app.graph.nodes );

			app.select_links = [];
			app.select_nodes = [];

			app.sim.update();
			app.histo.update( app.graph.degrees, app.max_degree, false );
		}
	);
	d3.select( app.view.select( "del" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.delete_elems( app.graph, app.select_links, app.select_nodes );
			ungroup( app.graph.links );
			ungroup( app.graph.nodes );

			app.select_links = [];
			app.select_nodes = [];

			app.sim.update();
			app.histo.update( app.graph.degrees, app.max_degree, false );
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

function update_auto_edit( app, value, max )	{

	if( value > 0 )	{

		function mutate_timeout_callback( d )	{

			let update = graph_edit.auto_edit_links( app.graph, app.max_degree, app.reset );
			app.reset = false;

			if( update == true )	{
				app.sim.update();
				app.histo.update( app.graph.degrees, app.max_degree, false );
			}
			if( app.auto )	{
				app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
			}
		}

		function rate_conversion( i, max )	{
			return( 10 + 1000 * ( max - i ) / max );
		}

		if( app.timeout ) app.timeout.stop();
		app.auto = true;
		app.ival = rate_conversion( value, Number( max ) );
		app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
	}
	else	{
		app.auto = false;
	}
}

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

///////////////////////////////////////////////////////////////////////
