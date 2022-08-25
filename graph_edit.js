
import * as graph_gen from './graph_gen.js';

export {

	add_elems,
	delete_elems,
	collect_links,
	auto_edit_links
};

///////////////////////////////////////////////////////////////////////

function collect_links( graph, select_nodes )	{

	let node_set = new Set( [ ...select_nodes ] );
	let links = [];

	for( let i=0; i< graph.links.length; i++ )	{
		if(
			node_set.has( graph.links[ i ].source.index ) ||
			node_set.has( graph.links[ i ].target.index )
		)	{
			links.push( i );
		}
	}
	return( links );
}

function collect_node_links( graph, node_index )	{

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

///////////////////////////////////////////////////////////////////////

function add_new_node( graph )	{

	let new_id = 0;
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
		graph.links.push(
			graph_gen.expand_link( graph, { source: s, target: t, group: 0 } )
		);

		graph.degrees[ src_index ]++;
		graph.degrees[ tgt_index ]++;

		return( true );
	}
	return( false );
}

function add_elems( graph, select_nodes )	{

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

function delete_elems( graph, select_links, select_nodes )	{


	let link_set = new Set( select_links );
	for( let i=0; i< select_nodes.length; i++ )	{

		let arr = collect_node_links( graph, select_nodes[ i ] );

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

	graph.map = graph_gen.build_node_map( graph.nodes );
}

///////////////////////////////////////////////////////////////////////

function auto_edit_links( graph, max_degree ) { // , reset_balance = false )	{

//	if( reset_balance ) console.log( "auto_edit_links: reset_balance" );
/*
	// static variable
    if( ( auto_edit_links.balance === undefined )|| reset_balance ) {
         auto_edit_links.balance = 0;

		// update only...
         // return( false );
    }
*/
	let edited = false;

//	if( Math.random() < 0.499 )	{
//	if( Math.random() < 0.47 )	{
	if( Math.random() < 0.4 )	{
//	if( Math.random() < 0.3 )	{

		// remove existing link

//		if( auto_edit_links.balance > -( max_degree / 2 ) )	{ // this is just a heuristic band-aid
		if( true )	{ // let it rip

			if( graph.links.length > 0 )	{

				let r_link_id = graph_gen.rand_int_range( 0, graph.links.length );

				delete_elems( graph, [ r_link_id  ], [] );

//				auto_edit_links.balance--;
				edited = true;
			}
		}
	}
	else	{
		// add new link

//		if( auto_edit_links.balance < ( max_degree * 2 ) )	{
		if( true )	{ // let it rip
//let repeat = 10;
// while( !edited && repeat ) { repeat--; // ... }

			let stub_counts = [];
			for( let i=0; i< graph.nodes.length; i++ )	{

//				stub_counts.push( graph.nodes[ i ].adjacent.length + 1 );
				stub_counts.push( Math.floor( Math.pow( graph.nodes[ i ].adjacent.length + 1, 1.5 ) ) );
//				stub_counts.push( Math.pow( graph.nodes[ i ].adjacent.length + 1, 2 ) );
			}
			let stubs = graph_gen.expand_stub_array( stub_counts );

// while( !edited && repeat ) { repeat--; // ... }

			let r_src_id = stubs[ graph_gen.rand_int_range( 0, stubs.length ) ];
			let r_tgt_id = stubs[ graph_gen.rand_int_range( 0, stubs.length ) ];

			if( r_src_id != r_tgt_id )	{

				if( add_new_link( graph, r_src_id, r_tgt_id ) )	{ // not already adjacent

//					auto_edit_links.balance++;
					edited = true;
				}
			}
		}
	}

//	console.log( "auto_edit_links.balance: " + auto_edit_links.balance );
	return( edited );
}

