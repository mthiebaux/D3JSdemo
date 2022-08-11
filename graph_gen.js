
export {
	build_node_map,
	simple_graph,
	ring_graph,
	power_graph,
	rand_int_range,
	expand_stub_array
};

///////////////////////////////////////////////////////////////////////

function build_node_map( nodes )	{

	let map = new Map();
	for( let i=0; i< nodes.length; i++ )	{
		map.set( nodes[ i ].id, i );
	}
	return( map );
}

function simple_graph()	{

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

function ring_graph( n, w )	{

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

function rand_range( ge_min, lt_max )	{

	return( ( Math.random() ) * ( lt_max - ge_min ) + ge_min );
}

function rand_int_range( ge_min, lt_max )	{

	return( Math.floor( rand_range( ge_min, lt_max ) ) );
}

// https://willnewton.name/2013/09/10/a-simple-power-law-pseudo-random-number-generator/
function rand_pow_law( ge_min, lt_max, exp = 2.0 )	{

	let min_pow = Math.pow( ge_min, 1.0 - exp );
	let max_pow = Math.pow( lt_max, 1.0 - exp );
	let rand_pow = Math.pow(
		rand_range( min_pow, max_pow ),
		1.0 / ( 1.0 - exp )
	);
	return( rand_pow );
}

function shuffle_array( arr )	{

	for( let i=0; i< arr.length; i++ )	{
		let j = rand_int_range( i, arr.length ); // must allow null-swap
		let tmp = arr[ i ];
		arr[ i ] = arr[ j ];
		arr[ j ] = tmp;
	}
	return( arr );
}

function shuffle_array_copy( arr )	{

	return( shuffle_array( [ ...arr ] ) );
}

function generate_unique_rand_arr( min, max )	{

	// each integer in range appears once

	let arr = [];
	let n = max - min;
	for( let i=0; i<= n; i++ )	{
		arr[ i ] = min + i;
	}
	return( shuffle_array( arr ) );
}

///////////////////////////////////////////////////////////////////////

function expand_stub_array( seq )	{

	//    degree sequence  -->  stub-array
	//   [ 1,1,1,1,2,3,3 ] --> [ 1,2,3,4,5,5,6,6,6,7,7,7 ]		1-indexing from paper
	//   [ 1,1,1,1,2,3,3 ] --> [ 0,1,2,3,4,4,5,5,5,6,6,6 ]		0-indexing
	//   [ 0,8,4,2 ]       --> [ 1,1,1,1,1,1,1,1,2,2,2,2,3,3 ]	0-indexing from paper

	let arr = [];
	for( let i=0; i< seq.length; i++ )	{

		for( let j=0; j< seq[ i ]; j++ )	{

			arr.push( i );
		}
	}
	return( arr );
}

function balance_stub_array( stubs )	{

	// ensure even number of stubs
	// add random stub if necessary
	// bias toward nodes with more stubs

	let arr = [ ...stubs ];
	if( arr.length % 2 == 0 )	{
		return( arr );
	}
	let r = rand_int_range( 0, arr.length );
	arr.push( arr[ r ] );
	return( arr );
}

///////////////////////////////////////////////////////////////////////

function power_graph( num_nodes, min_degree, max_degree )	{

	let degree_sequence = new Array( num_nodes );
	for( let i=0; i< num_nodes; i++ )	{
		degree_sequence[ i ] = Math.floor( rand_pow_law( min_degree, max_degree + 1 ) );
	}

	let stubs = expand_stub_array( degree_sequence );
	let shuffled = shuffle_array_copy( stubs );
	let stub_list = balance_stub_array( shuffled );

	let adjacencies = [];
	for( let i=0; i< num_nodes; i++ )	{
		adjacencies[ i ] = [];
	}
	let edges = [];

	// stub pair matching, best effort
	// avoid self loops and double edges

	for( let i=0; i< num_nodes; i++ )	{

		let n = degree_sequence[ i ];	// node has n stubs
		let c = 0;				// stubs index

		while( ( c < stub_list.length ) && ( adjacencies[ i ].length < n ) )	{

			let p = stub_list[ c ];	// pairing candidate

			if( ( p >= 0 )&&( p != i ) )	{	// available and not self

				if( adjacencies[ p ].includes( i ) == false )	{ // not duplicate

					// store edge and adjacents
					let e = [ i, p ].sort( ( a, b ) => a - b ); // sort for undirected search

					edges.push( e );
					adjacencies[ i ].push( p );
					adjacencies[ p ].push( i );

					// invalidate both stubs
					stub_list[ c ] = -1;
					let found = false;
					for( let j=0; !found && ( j< stub_list.length ); j++ )	{

						if( stub_list[ j ] == i )	{ // remove first self stub found
							stub_list[ j ] = -1;
							found = true;
						}
					}
				}
			}
			c++;
		}
	}


	let graph_data = {
//		max_degree: max_degree,
//		degrees: degree_sequence, // NO, may have been adjusted for balance
		degrees: [],
		map: null,
		nodes: [],
		links: []
	};

	for( let i=0; i< num_nodes; i++ )	{

		graph_data.degrees.push( adjacencies[ i ].length );

		graph_data.nodes.push(
			{
				id: i,
				adjacent: adjacencies[ i ],
				group: 0,
			}
		);
	}
	graph_data.map = build_node_map( graph_data.nodes );

	for( let i=0; i< edges.length; i++ )	{

		graph_data.links.push(
			{
				source: edges[ i ][ 0 ],
				target: edges[ i ][ 1 ],
				group: 0
			}
		);
	}

	return( graph_data );
}

///////////////////////////////////////////////////////////////////////
