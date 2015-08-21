import { WritableStream } from 'stream';
import { StringDecoder } from 'string_decoder';

/**
 * Indents a multi-line string.
 *
 * @param {string} string Multi-line string to indent
 * @param {string} indent Indent to use
 * @return {string} Indented string
 */
export function indent(string: string, indent: string): string {
    return string.split('\n').map(line => indent + line).join('\n');
}

export function streamToStream(stream, callback) {
    const newStream = new WritableStream();
    stream.on('data', (data) => callback((data) => newStream.write(data), data));
    stream.on('done', () => newStream.end());
    return newStream;
}

export function streamToLetterStream(stream) {
    return streamToStream(stream, (write, buffer) => {
        for (let letter of buffer.toString()) {
            write(letter);
        }
    });
}
