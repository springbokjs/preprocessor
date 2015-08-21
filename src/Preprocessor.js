import { createReadStream } from 'fs';
import processors from './processors';
// import Processor from './Processor';
import Source from './Source';
import { streamToLetterStream } from './utils';

export default class Preprocessor {
    _processors: Map<string, Processor> = new Map();
    _sourcemap: any;
    _options: Object;

    constructor(options: Object) {
        this._options = options;
        // include(?:Once)?|ifn?def|ifelse|if|\/if|endif|else|el(?:se)?if|eval|value|val|setbasedir
    }

    hasDefined(key): boolean {
        return key in this._options.defines;
    }

    getDefined(key) {
        if (!this.hasDefined(key)) {
            throw new Error('Missing defined value: "' + key + '"');
        }

        return this._options.defines[key];
    }

    addDefaultProcessors() {
        processors.forEach(def => {
            const processor = new def.Class(this);

            def.instructions.forEach(instruction => {
                this.addProcessor(instruction, processor);
            });
        });
    }

    addProcessor(instruction: string, processor: Processor) {
        this._processors.set(instruction, processor);
    }

    processFile(filepath: string, filename: string, output): Promise<Source> {
        const fileStream = createReadStream(filepath);
        return this.processStream(filename || filepath, fileStream, output);
    }

    processStream(filename, stream, output) {
        return new Promise((resolve, reject) => {
            const source = new Source(this, filename, output);
            const stream = streamToLetterStream(stream);

            stream.on('data', (letter) => {
                stream.pause();
                source.processLetter(letter).then(() => {
                    stream.resume();
                }).catch(reject);
            });

            stream.on('end', () => {
                source.end().then(() => resolve(source)).catch(reject);
            });
        });
    }

    async process(filename: string, content, output): Source {
        if (content instanceof Buffer) {
            content = content.toString();
        }

        const source = new Source(this, filename, output);

        for (let letter of content) {
            await source.processLetter(letter);
        }

        await source.end();
        return source;
    }
}
