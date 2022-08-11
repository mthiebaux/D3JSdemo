
import * as graph_gen from './graph_gen.js';

export {
	select_links,
	add_elems,
	del_elems
};

///////////////////////////////////////////////////////////////////////

function select_links( graph, select_nodes )	{

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

//	let new_id = 10; // 0; for testing
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
		graph.links.push( { source: s, target: t, group: 0 } );

		graph.degrees[ src_index ]++;
		graph.degrees[ tgt_index ]++;
	}
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

function del_elems( graph, select_links, select_nodes )	{

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

	graph.map = graph_gen.build_node_map( graph.nodes );
}

///////////////////////////////////////////////////////////////////////

