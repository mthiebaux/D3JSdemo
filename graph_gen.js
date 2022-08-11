
export {
	build_node_map,
	simple_graph,
	ring_graph
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

