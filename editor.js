
// d3.select is not a function:
//import * as d3 from './d3.v7.min.js'
//import * as d3 from 'https://d3js.org/d3.v7.min.js'
//import * as d3 from 'https://d3js.org/d3.v7.js'

import * as d3 from "https://cdn.skypack.dev/d3@7"; // GitHub recommended

//import * as d3 from 'https://unpkg.com/d3?module' // slower to load?


import * as graph_gen from './graph_gen.js';
import * as graph_edit from './graph_edit.js';
import * as graph_sim from './graph_sim.js';

export { init };

///////////////////////////////////////////////////////////////////////

function init( view )	{

//	let app = create_graph_editor( view );

	let sim = graph_sim.create( view, 300, 300 );
	let graph = graph_gen.simple_graph();
	let attr = attributes( 10 );

	sim.init( graph, attr );
	sim.update();

	let app = {

		view,
		attr,
		graph,
		sim,

		timeout: null,
		auto: false,
		ival: 1000,
		reset: true
	};

	register_events( app );
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

///////////////////////////////////////////////////////////////////////

function register_events( app )	{

	d3.select( app.view.select( "simple" ) ).on(
		"mousedown",
		function( event )	{

			app.reset = true; // auto-edit balace reset
			app.graph = graph_gen.simple_graph();
			app.sim.init( app.graph, app.attr );
			app.sim.update();
		}
	);
	d3.select( app.view.select( "ring" ) ).on(
		"mousedown",
		function( event )	{

			app.reset = true;
			app.graph = graph_gen.ring_graph( 6, 1 );
			app.sim.init( app.graph, app.attr );
			app.sim.update();
		}
	);
	d3.select( app.view.select( "chain" ) ).on(
		"mousedown",
		function( event )	{

			app.reset = true;
			app.graph = graph_gen.ring_graph( 12, 2 );
			app.sim.init( app.graph, app.attr );
			app.sim.update();
		}
	);
	d3.select( app.view.select( "power" ) ).on(
		"mousedown",
		function( event )	{

			app.reset = true;
			app.graph = graph_gen.power_graph( 32, 0.9, 10 );
			app.sim.init( app.graph, app.attr );
			app.sim.update();
		}
	);

	function ungroup( arr )	{
		for( let i=0; i< arr.length; i++ )	{
			arr[ i ].group = 0;
		}
	}

	d3.select( app.view.select( "links" ) ).on(
		"mousedown",
		function( event )	{

			ungroup( app.graph.links );
			app.sim.select_links = graph_edit.select_links( app.graph, app.sim.select_nodes );

			ungroup( app.graph.nodes );
			app.sim.select_nodes = [];
			app.sim.update();
		}
	);
	d3.select( app.view.select( "add" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.add_elems( app.graph, app.sim.select_nodes );
			ungroup( app.graph.links );
			ungroup( app.graph.nodes );

			app.sim.select_links = [];
			app.sim.select_nodes = [];
			app.sim.update();
		}
	);
	d3.select( app.view.select( "del" ) ).on(
		"mousedown",
		function( event )	{

			graph_edit.delete_elems( app.graph, app.sim.select_links, app.sim.select_nodes );
			ungroup( app.graph.links );
			ungroup( app.graph.nodes );

			app.sim.select_links = [];
			app.sim.select_nodes = [];
			app.sim.update();
		}
	);

	function mutate_timeout_callback( d )	{

		let update = graph_edit.auto_edit( app.graph, 10, app.reset );
		app.reset = false;

		if( update == true )	{

//			init_histogram( hist, graph.degrees, graph.max_degree );
			app.sim.update();
		}
		if( app.auto )	{
			app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
		}
	}

	d3.select( app.view.select( "rate" ) ).on(
		"input",
		function( event )	{

			if( this.value > 0 )	{

				function rate_conversion( i, max )	{
					return( 10 + 1000 * ( max - i ) / max );
				}

				if( app.timeout ) app.timeout.stop();
				app.auto = true;
				app.ival = rate_conversion( this.value, Number( this.max ) );
				app.timeout = d3.timeout( mutate_timeout_callback, app.ival );
			}
			else	{
				app.auto = false;
			}
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
