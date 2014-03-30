//https://github.com/dcodeIO/Preprocessor.js/blob/master/Preprocessor.js
var fs=require('fs'), sysPath=require('path'), S = require('springbokjs-utils');

function process(type,pathResolver,defines,data,dirname,includedFiles,callback){
	var Preprocessor=(function(){
		var EXPR_INSTRUCTIONS = '(include(?:Once)?|ifn?def|ifelse|if|\/if|endif|else|el(?:se)?if|eval|value|val|setbasedir)';
		var multilineRegExp = new RegExp('(^[ ]*)?\\/\\*[ ]*#[ ]*' + EXPR_INSTRUCTIONS + '([^\\*]*)[ ]*\\*\\/','gm');
		var singlelineRegExp = new RegExp('(^[ \t]+)(?:\\/\\/)?#' + EXPR_INSTRUCTIONS + '(.*)$', 'gm');
		
		return {
			errorSourceAhead:50,
			
			EXPR: multilineRegExp,
			EXPR_TYPE:{
				php: [ singlelineRegExp ],
				js: [ singlelineRegExp, new RegExp('(^[ \t]*)?(include(?:Once)?)\\(\'([^\)]*)\'\\)') ],
				styl: [ new RegExp('(^[ \t]+)@' + EXPR_INSTRUCTIONS + '(.*);$', 'gm') ],
			},
			
			/**
			 * Indents a multi-line string.
			 * @param {string} str Multi-line string to indent
			 * @param {string} indent Indent to use
			 * @return {string} Indented string
			 * @expose
			 */
			indent:function(str, indent) {
				var lines = str.split("\n");
				for (var i=0; i<lines.length; i++)
					lines[i] = indent + lines[i];
				return lines.join("\n");
			}
		};
	})();
	
	//Todo : asyncWhile
	var a = type && Preprocessor.EXPR_TYPE[type] || [];
	a.push( Preprocessor.EXPR );
	UArray.forEachSeries(a,function(EXPR,onEnd){
		var stack = [];
		S.asyncWhile(function(callback){ callback(EXPR.exec(data)); },function(match,onEnd){
			var match2, include;
			
			//console.log(match,match.index,EXPR.lastIndex);
			var indent = match[1], instruction=match[2], content=match[3].trim();
			switch (instruction) {
				case 'eval':
				case 'value': case 'val':
					if(instruction==='eval') include = eval(content);
					else include = String(defines[content]);
					
					var removeAfterLength=0,
						first5=data.substr(EXPR.lastIndex,5), 
						first4=first5&&first5.substr(0,4), 
						first2=first4&&first4.substr(0,2);
					if(first2){
						if(first2==='0 ') removeAfterLength=2;
						else if(['0;','0,','0)','0.','0+','0-'].indexOf(first2)!==-1) removeAfterLength=1;
						else if(first2==="''") removeAfterLength=2;
						else if(first5==='false') removeAfterLength=5;
						else if(first4==='true') removeAfterLength=4;
					}
					
					data = data.substring(0, match.index)+include+data.substring(EXPR.lastIndex + removeAfterLength);
					EXPR.lastIndex = match.index + include.length;
					onEnd();
					break;
				
				case 'setdirname':
					dirname = content.trimRight('/') + '/';
					onEnd();
					break;
				
				case 'ifdef': case 'ifndef': case 'if': case 'ifelse':
					if (instruction==='ifdef') include = defines.hasOwnProperty(content);//!!defines[match2[2]];
					else if (instruction==='ifndef') include = !defines.hasOwnProperty(content);//!defines[match2[2]];
					else if (instruction==='ifelse') include = defines[content] ? 1 : 2;
					else{
						var ifThenMatch=/^(.*) then (.*)$/.exec(content);
						if(ifThenMatch){
							include = defines[ifThenMatch[1]] ? ifThenMatch[2] : '';
							data = data.substring(0, match.index)+include+data.substring(EXPR.lastIndex);
							onEnd();
							break;
						}else if(content.slice(-2)==='=>'){// if var =>
							content=content.slice(0,-2).trim();
							if(defines[content])
								data = data.substring(0, match.index)+data.substring(EXPR.lastIndex);
							else
								data = data.substring(0, match.index)+data.substring(data.indexOf("\n",EXPR.lastIndex));
						}else{
							if(content.charAt(0)==='!') include = !defines[content.substr(1).trim()];
							else include = defines[content];
						}
					}
					
					stack.push({ "include": include, "index": match.index, "lastIndex": EXPR.lastIndex });
					onEnd();
					break;
				
				case '/if': case 'endif': case 'else': case 'elif': case 'elseif':
					if (stack.length == 0)
						throw(new Error("Unexpected #"+instruction+": "+data.substring(match.index, match.index+Preprocessor.errorSourceAhead)+"..."));
					
					var before = stack.pop();
					include = data.substring(before["lastIndex"], match.index);
					if(before.include === 1 || before.include === 2){
						if(include.charAt(0)==='(' && include.slice(-1)===')') include=include.slice(1,-1);
						include=include.split('||');
						if(include.length !== 2) return onEnd('ifelse : '+include.length+' != 2 : '+include.join('||'));
						include=include[before.include-1];
					}else if(!before.include) include='';
					data = data.substring(0, before["index"])+include+data.substring(EXPR.lastIndex);
					EXPR.lastIndex = before["index"]+include.length;
					if (instruction == "else" || instruction == "elif" || instruction == "elseif") {
						if(instruction==='else') include=!before['include'];
						else{
							if(content.charAt(0)==='!') include = !defines[content.substr(1).trim()];
							else include = defines[content];
						}
						stack.push({ "include": !before["include"], "index": EXPR.lastIndex, "lastIndex": EXPR.lastIndex });
					}
					onEnd();
					break;
				
				case 'include': case 'includeOnce':
					if(content.slice(-1) === '/') content += sysPath.basename(content) + '.js';
					else if(content.slice(-3) !== '.js') content += '.js';
					if(content.substr(0,1) !== '/') content = dirname + content;
					var path = (pathResolver||fs.realpathSync)(content);
					if(instruction === 'includeOnce' && includedFiles.indexOf(path) !== -1){
						data = data.substring(0, match.index) + '' + data.substring(EXPR.lastIndex + removeAfterLength);
						onEnd();
					}else{
						includedFiles.push(path);
						fs.readFile(path,function(err,content){
							if(err) return onEnd(err);
							module.exports(defines, content, baseDir, includedFiles,function(err,include){
								if(err) return onEnd(err);
								data = data.substring(0, match.index) + content + data.substring(EXPR.lastIndex + removeAfterLength);
								onEnd();
							});
						});
					}
					break;
			}
		},function(err){
			if(!err) return onEnd(err);
			if(stack.length!==0) return onEnd('Still have stack : missing endif');
			if(!data) return onEnd('Data is now empty...');
			onEnd(null);
		});
	},function(err){
		callback(err,data);
	});
	//return future;
};

module.exports=function(type,pathResolver){
	return function(defines,data,isBrowser,dirname,callback){
		if(!callback) throw new Error('callback is not defined...');
		defines=defines||{};
		defines.NODE=!isBrowser; defines.BROWSER=!!isBrowser;
		
		process(type,pathResolver,defines,data,dirname,[],callback);
	};
};