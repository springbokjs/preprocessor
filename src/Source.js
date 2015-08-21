import { SourceMapGenerator } from 'source-map';
import Preprocessor from './Preprocessor';

const isSpaceRegexp = /\s/;

export default class Source {
    _filename: string;
    _sourcemap;
    _state;
    _lastOriginalPosition = { line: 1, col: 0 };
    _lastOutputPosition = { line: 1, col: 0 };

    _output: Stream;
    _buffer: string;
    _currentInstruction: string;

    /**
     * @param {Preprocessor} preprocessor
     * @param {string} filename
     * @param {string|Stream} [output]
     */
    constructor(preprocessor: Preprocessor, filename: string, output: Stream) {
        this._filename = filename;
        this._state = 'none';
        this._preprocessor = preprocessor;
        this._sourcemap = new SourceMapGenerator({
            // file: destfile,
        });
        this._output = output || process.stdout;
        this._buffer = '';
        this.expectingEOF = 0;
        this._throwAway = false;
    }

    getSourceMap() {
        return this._sourcemap;
    }

    async processLetter(letter) {
        // console.log('process letter ', letter, this._state);
        switch (this._state) {
            case 'none':
            case 'after-processor':
                if (letter === '/') {
                    this.writeBufferToOutput();
                    this._state = 'first-slash';
                    this._buffer += letter;
                    break;
                }

                if (this._state === 'after-processor') {
                    const result = await this._lastProcessor.processLetter({
                        letter,
                        source: this,
                        buffer: this._buffer,
                    });

                    if (result) {
                        if (result.ignoreLetter && result.ignoreBuffer) {
                            result.replaceBy = '';
                        }

                        if (result.bufferLetter) {
                            this._buffer += letter;
                            break;
                        } else if (result.replaceBy) {
                            this.writeToOutput(result.replaceBy, true);
                            this.ignoreBuffer();
                            break;
                        } else if (result.ignoreBuffer) {
                            this.ignoreBuffer();
                            this._state = 'none';
                            // keep going to write current letter
                        }
                    } else {
                        this._buffer += letter;
                        this.writeBufferToOutput();
                        this._state = 'none';
                    }
                }

                if (this.keepBuffering) {
                    this._buffer += letter;
                } else {
                    this.writeToOutput(letter);
                    this.advancePosition(this._lastOriginalPosition, letter);
                }

                break;

            case 'first-slash':
                if (letter === '/') {
                    this._state = 'oneline-comment';
                    this._buffer += letter;
                } else if (letter === '*') {
                    this._state = 'multiline-comment';
                    this._buffer += letter;
                } else {
                    this._state = 'none';
                    this.writeToOutput('/' + letter);
                    this._buffer = '';
                }

                break;

            case 'online-comment':
            case 'multiline-comment':
                this._buffer += letter;
                if (isSpaceRegexp.test(letter)) {
                    this._buffer += letter;
                } else if (letter === '#') {
                    this._currentInstruction = '';
                    this._state += '-instruction';
                } else {
                    this._output.write(this._buffer);
                    this._buffer = '';
                    this._state = 'none';
                }

                break;

            case 'online-comment-instruction':
            case 'multiline-comment-instruction':
                this._buffer += letter;
                if (this._state === 'online-comment-instruction' && letter === '\n') {
                    await this.callProcessor();
                    break;
                }

                if (isSpaceRegexp.test(letter)) {
                    this._currentInstructionContent = '';
                    this._state += '-content-start';
                    break;
                }

                if (this._state.startsWith('multiline') && letter === '*') {
                    this._state = 'multiline-comment-instruction-star';
                    this._previousState = 'multiline-comment-instruction';
                    break;
                }

                this._currentInstruction += letter;

                break;

            case 'online-comment-instruction-content-start':
            case 'multiline-comment-instruction-content-start':
                this._buffer += letter;
                if (!isSpaceRegexp.test(letter)) {
                    if (this._state.startsWith('multiline') && letter === '*') {
                        this._state = 'multiline-comment-instruction-star';
                        this._previousState = 'multiline-comment-instruction-content-start';
                    } else {
                        this._currentInstructionContent = letter;
                        this._state = this._state.slice(0, -6);
                    }
                }

                break;

            case 'online-comment-instruction-content':
            case 'multiline-comment-instruction-content':
                this._buffer += letter;
                if (this._state.startsWith('multiline') && letter === '*') {
                    this._state = 'multiline-comment-instruction-star';
                    this._previousState = 'multiline-comment-instruction-content';
                    break;
                } else if (this._state === 'online-comment-instruction-content' && letter === '\n') {
                    await this.callProcessor();
                    break;
                }

                this._currentInstructionContent += letter;

                break;

            case 'multiline-comment-instruction-star':
                this._buffer += letter;

                if (letter === '*') {
                    this._currentInstructionContent += '*';
                    break;
                }

                if (letter !== '/') {
                    this._currentInstructionContent += '*' + letter;
                    this._state = this._previousState;
                    break;
                }

                await this.callProcessor();

                break;
        }
    }

    async end() {
        // console.log('end', this._state);

        if (this.expectingEOF !== 0) {
            throw new Error('Unexpected EOF');
        }

        if (this._state === 'none') {
            if (this._buffer) {
                // still waiting for the end of an instruction
                throw new Error('Unexpected EOF');
            }

            return;
        }

        if (this._state.startsWith('online-comment-instruction')) {
            this.callProcessor();
            return;
        }

        if (this._state.startsWith('multiline-comment')) {
            throw new Error('Unexpected EOF: expecting end of multiline comment');
        }

        throw new Error('Unexpected EOF');
    }

    async callProcessor() {
        const processor = this._preprocessor._processors.get(this._currentInstruction);
        this._lastProcessor = processor;

        if (!processor) {
            throw new Error('Missing processor for instruction ' + this._currentInstruction);
        }

        const result = await processor.process({
            instruction: this._currentInstruction,
            source: this,
            preprocessor: this._preprocessor,
            content: this._currentInstructionContent.trimRight(),
        });

        if (result && result.replaceBy !== undefined) {
            this.writeToOutput(result.replaceBy, true);
            this.ignoreBuffer();
        } else if (!result || !result.keepBuffering) {
            this.writeBufferToOutput();
        }

        this.keepBuffering = result && result.keepBuffering;

        if (result && result.throwAway !== undefined) {
            this._throwAway = result.throwAway;
        }

        if (result && result.keepCallMe) {
            this._state = 'after-processor';
        } else {
            this._state = 'none';
        }
    }

    advancePosition(position, letter) {
        if (letter === '\n') {
            position.line = this._lastOutputPosition.line + 1;
            position.col = 0;
            return false;
        } else {
            position.col++;
            return true;
        }
    }

    writeBufferToOutput() {
        for (let letter of this._buffer) {
            this.writeToOutput(letter);
            this.advancePosition(this._lastOriginalPosition, letter);
        }

        this._buffer = '';
    }

    writeToOutput(string: string, force: boolean) {
        if (this._throwAway && !force) {
            return;
        }

        this._output.write(string);
        for (let letter of string) {
            if (letter !== '\n') {
                this._sourcemap.addMapping({
                    generated: {
                        line: this._lastOriginalPosition.line,
                        column: this._lastOriginalPosition.col,
                    },

                    source: this._filename,
                    original: {
                        line: this._lastOutputPosition.line,
                        column: this._lastOutputPosition.col,
                    },

                    name: letter,
                });
            }

            this.advancePosition(this._lastOutputPosition, letter);
        }
    }

    ignoreBuffer() {
        for (let letter in this._buffer) {
            this.advancePosition(this._lastOriginalPosition, letter);
        }

        this._buffer = '';
    }
}
