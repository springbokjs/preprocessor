import ValueProcessor from './ValueProcessor';
import IfProcessor from './IfProcessor';

export default [
    {
        instructions: ['val', 'eval', 'value'],
        Class: ValueProcessor,
    },
    {
        instructions: [
            'ifdef', 'ifnotdef', 'if', 'ifnot',
            'elseif', 'elseifdef', 'else',
            '/ifdef', '/ifnotdef', '/if', '/ifnot',
        ],
        Class: IfProcessor,
    },
];
