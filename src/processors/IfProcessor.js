import AbstractProcessor from './AbstractProcessor';

export default class IfProcessor extends AbstractProcessor {
    constructor() {
        super(...arguments);
        this.stack = [];
        this.throwAway = false;
    }

    async process({ source, instruction, content }) {
        const pop = () => {
            source.expectingEOF--;
            const value = this.stack.pop();

            if (this.stack.length === 0) {
                this.throwAway = false;
            } else {
                this.throwAway = this.stack.some(value => !value.includes || value.throwAway);
            }

            return value;
        };

        let includes;
        let throwAway = false;
        if (instruction === 'elseif' || instruction === 'elseifdef') {
            instruction = instruction === 'elseif' ? 'if' : 'ifdef';
            const value = pop();
            throwAway = value.includes || value.throwAway;
        }

        if (instruction === 'ifdef') {
            includes = this.hasDefined(content);
        } else if (instruction === 'ifnotdef') {
            includes = !this.hasDefined(content);
        } else if (instruction === 'if') {
            includes = !!this.getDefined(content);
        } else if (instruction === 'ifnot') {
            includes = !this.getDefined(content);
        } else if (instruction === 'else') {
            const previous = pop();
            includes = !previous.includes && !previous.throwAway;
            instruction = 'if';
        }

        if (['ifdef', 'ifnotdef', 'if', 'ifnot'].indexOf(instruction) !== -1) {
            source.expectingEOF++;
            if (throwAway) {
                this.throwAway = true;
            } else if (!this.throwAway && !includes) {
                this.throwAway = !includes;
            }

            this.stack.push({ includes, throwAway });
        } else {
            pop();
        }

        return {
            replaceBy: '',
            throwAway: this.throwAway,
        };
    }
}
