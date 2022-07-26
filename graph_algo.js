
import * as graph_gen from './graph_gen.js';

export {
	test,
	find_path_links,
	generate_link_weights,
	path_search_BFS,
	path_search_Dijkstra
};

///////////////////////////////////////////////////////////////////////


/*

degree-based link weighting: w = sqrt( d0 ) * sqrt( d1 )

	1.0  1.4  1.7  2.0  2.2  2.4  2.6  2.8  3.0  3.2

	1.4  2.0  2.4  2.8  3.2  3.5  3.7  4.0  4.2  4.5

	1.7  2.4  3.0  3.5  3.9  4.2  4.6  4.9  5.2  5.5

	2.0  2.8  3.5  4.0  4.5  4.9  5.3  5.7  6.0  6.3

	2.2  3.2  3.9  4.5  5.0  5.5  5.9  6.3  6.7  7.1

	2.4  3.5  4.2  4.9  5.5  6.0  6.5  6.9  7.3  7.7

	2.6  3.7  4.6  5.3  5.9  6.5  7.0  7.5  7.9  8.4

	2.8  4.0  4.9  5.7  6.3  6.9  7.5  8.0  8.5  8.9

	3.0  4.2  5.2  6.0  6.7  7.3  7.9  8.5  9.0  9.5

	3.2  4.5  5.5  6.3  7.1  7.7  8.4  8.9  9.5  10.

invert-basis 10:

	10.  7.1  5.8  5.0  4.5  4.1  3.8  3.5  3.3  3.2

	7.1  5.0  4.1  3.5  3.2  2.9  2.7  2.5  2.4  2.2

	5.8  4.1  3.3  2.9  2.6  2.4  2.2  2.0  1.9  1.8

	5.0  3.5  2.9  2.5  2.2  2.0  1.9  1.8  1.7  1.6

	4.5  3.2  2.6  2.2  2.0  1.8  1.7  1.6  1.5  1.4

	4.1  2.9  2.4  2.0  1.8  1.7  1.5  1.4  1.4  1.3

	3.8  2.7  2.2  1.9  1.7  1.5  1.4  1.3  1.3  1.2

	3.5  2.5  2.0  1.8  1.6  1.4  1.3  1.2  1.2  1.1

	3.3  2.4  1.9  1.7  1.5  1.4  1.3  1.2  1.1  1.1

	3.2  2.2  1.8  1.6  1.4  1.3  1.2  1.1  1.1  1.0

*/


function print_link_weight_table( n )	{

	for( let i=1; i<= n; i++ )	{
		let s = "";
		for( let j=1; j<= n; j++ )	{

//			let w = Math.sqrt( i ) * Math.sqrt( j );
			let w = 10.0 / ( Math.sqrt( i ) * Math.sqrt( j ) );

			s += w.toPrecision( 2 ) + "  ";
		}
		console.log( s );
	}
}

function generate_link_weights( graph, invert_basis = 0 )	{

//	print_link_weight_table( 10 );

	let weights = [];
	for( let i=0; i< graph.links.length; i++ )	{

		let sd = graph.links[ i ].source.adjacent.length;
		let td = graph.links[ i ].target.adjacent.length;

		let w = Math.sqrt( sd ) * Math.sqrt( td );
		if( invert_basis )	{
			w = invert_basis / w;
		}
//		console.log( i + ": " + sd + ", " + td + " : " + w.toPrecision( 3 ) );

		weights.push( w );
	}
	return( weights );
}

///////////////////////////////////////////////////////////////////////

function find_path_links( graph, node_ids )	{

	if( node_ids.length < 2 ) return( [] );

	let link_set = new Set();
	let fr_id = node_ids[ 0 ];

	for( let i= 1; i< node_ids.length; i++ )	{

		let to_id = node_ids[ i ];

		let [ a, b ] = [ fr_id, to_id ].sort( (a, b) => a - b );
		link_set.add( a + "-" + b );

		fr_id = to_id;
	}

	let links = [];
	for( let i=0; i< graph.links.length; i++ )	{

		let str = graph.links[ i ].source.id + "-" + graph.links[ i ].target.id; // pre-sorted
		if( link_set.has( str ) )	{
			links.push( i );
		}
	}
	return( links ); // sorted by default
}

function test()	{

/*

	0 --- 1     2 --- 3
	|     |  /  |  /  |
	4    (5)*** 6 ***(7)

*/

	let graph = graph_gen.test_graph();

	let nodes = path_search_BFS( graph, 5, 7 );
	console.log( nodes );

	let links = find_path_links( graph, nodes );
	console.log( links );
}

///////////////////////////////////////////////////////////////////////

function path_search_BFS( graph, fr_id, to_id )	{ // returns array of node id, not index

	if( ( graph.map.has( fr_id ) == false )||(  graph.map.has( to_id ) == false ) )	{
		return( [] );
	}
	if( fr_id == to_id )	{ // redundant? no, it will bounce off adjacent
		return( [ fr_id ] );
	}

	// convert node id to array index
	const index = ( id ) => graph.map.get( id );

	let parent = new Array( graph.nodes.length ).fill( -1 );
	let queue = [];

	parent[ index( fr_id ) ] = fr_id;
	queue.push( fr_id );

	while( queue.length )	{

		let p_id = queue.shift();
		let node = graph.nodes[ index( p_id ) ];

		for( let i=0; i< node.adjacent.length; i++ )	{

			let adj_id = node.adjacent[ i ];
			if( adj_id == to_id )	{

				let path = [ to_id ];
				path.push( p_id );
				while( p_id != fr_id )	{

					p_id = parent[ index( p_id ) ];
					path.push( p_id );
				}
				return( path.reverse() );
			}
			if( parent[ index( adj_id ) ] == -1 )	{

				parent[ index( adj_id ) ] = p_id;
				queue.push( adj_id );
			}
		}
	}
	return( [] );
}

///////////////////////////////////////////////////////////////////////

function path_search_Dijkstra( graph, weights, fr_id, to_id )	{

  // returns array of node id, not index

	if( ( graph.map.has( fr_id ) == false )||(  graph.map.has( to_id ) == false ) )	{
		return( [] );
	}
	if( fr_id == to_id )	{ // redundant? no, it will bounce off adjacent... Check this
		return( [ fr_id ] );
	}

	// by node id, not array index:
	let visited = new Set();
	let frontier = new Set( [ fr_id ] );

	// convert node id to array index
	const index = ( id ) => graph.map.get( id );

	// by array index, not node id:
	let distance = new Array( graph.nodes.length ).fill( Infinity );
	distance[ index( fr_id ) ] = 0;

	// by array index, not node id:
	let parent = new Array( graph.nodes.length ).fill( -1 );
	parent[ index( fr_id ) ] = -1;

	let weight_map = create_weight_map( weights );

	// core processing loop:

	let curr_id = fr_id;
	while( frontier.size > 0 )	{

		for( let i=0; i< graph.nodes[ index( curr_id ) ].adjacent.length; i++ )	{

			let adj_id = graph.nodes[ index( curr_id ) ].adjacent[ i ];

			if( visited.has( adj_id ) == false )	{

				// check distance and add to frontier
				test_frontier( curr_id, adj_id );
			}
		}

		set_visited( curr_id );
		curr_id = min_frontier();
	}

	if( parent[ index( to_id ) ] > -1 )	{

		let path = [ to_id ];
		let p_id = to_id;
		while( p_id != fr_id )	{

			p_id = parent[ index( p_id ) ];
			path.push( p_id );
		}
		return( path.reverse() );
	}
	return( [] );

  // private member functions:

	function create_weight_map( w_arr ) {

		let map = new Map();
		for( let i=0; i< graph.links.length; i++ )	{
			let str = graph.links[ i ].source.id + "-" + graph.links[ i ].target.id; // assume sorted
			map.set( str, weights[ i ] );
		}
		return( map );
	}

	function get_weight( fr_id, to_id )	{

		let [ s, t ] = [ fr_id, to_id ].sort( (a, b) => a - b );
		return( weight_map.get( s + "-" + t ) );
	}

	function set_visited( id )	{

		if( frontier.delete( id ) )	{
			visited.add( id );
		}
		else	{
			console.log( "ERR: set_visited id: " + id );
		}
	}

	function min_frontier()	{

		let min_d = Infinity;
		let min_id = -1;
		function check_min( id )	{

			let d = distance[ index( id ) ];
			if( d < min_d )	{
				min_d = d;
				min_id = id;
			}
		}
		frontier.forEach( check_min );
		return( min_id );
	}

	function test_frontier( curr_id, adj_id )	{

		// path distance is a summation of link weights
		let d = distance[ index( curr_id ) ] + get_weight( curr_id, adj_id );

		let adj_i = index( adj_id );
		if( d < distance[ adj_i ] )	{
			distance[ adj_i ] = d;
			parent[ adj_i ] = curr_id;
		}
		frontier.add( adj_id );
	}
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

