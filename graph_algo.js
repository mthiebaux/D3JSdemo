
import * as graph_gen from './graph_gen.js';

export {
	test,
	path_search_BFS
};

///////////////////////////////////////////////////////////////////////

function find_links( graph, node_ids )	{

	if( node_ids.length < 2 ) return( [] );

	let link_set = new Set();
	let fr_id = node_ids[ 0 ];

	for( let i= 1; i< node_ids.length; i++ )	{

		let to_id = node_ids[ i ];

		let [ a, b ] = [ fr_id, to_id ].sort( (a, b) => a - b );
		let str = a + "-" + b;
		link_set.add( str );

		fr_id = to_id;
	}

	let links = [];
	for( let i=0; i< graph.links.length; i++ )	{

		let str = graph.links[ i ].source.id + "-" + graph.links[ i ].target.id; // pre-sorted
		if( link_set.has( str ) )	{
			links.push( i );
		}
	}
	return( links );
}

function test()	{

	let graph = graph_gen.test_graph();

	let nodes = path_search_BFS( graph, 5, 7 );
//	let nodes = path_search_BFS( graph, 4, 6 );
	console.log( nodes );

	let links = find_links( graph, nodes );
	console.log( links );
}

/*

	0 --- 1     2 --- 3
	|     |  /  |  /  |
	4    (5)*** 6 ***(7)

*/

function path_search_BFS( graph, fr_id, to_id )	{ // returns array of node index, not id

	if( fr_id == to_id )	{ // redundant?
		return( [ fr_id ] );
	}

	let parent = new Array( graph.nodes.length ).fill( -1 );
	let queue = [];

	parent[ fr_id ] = fr_id;
	queue.push( fr_id );

	while( queue.length )	{

		let p_id = queue.shift();
		let node = graph.nodes[ p_id ];

		for( let i=0; i< node.adjacent.length; i++ )	{

			let adj_id = node.adjacent[ i ];
			if( adj_id == to_id )	{

				let path = [ to_id ];
				path.push( p_id );

				while( p_id != fr_id )	{
					p_id = parent[ p_id ];
					path.push( p_id );
				}
				return( path.reverse() );
			}
			if( parent[ adj_id ] == -1 )	{

				parent[ adj_id ] = p_id;
				queue.push( adj_id );
			}
		}
	}
	return( [] );
}

///////////////////////////////////////////////////////////////////////
