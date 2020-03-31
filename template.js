class Template
{
    constructor()
    {
    }

    getBlockTemplate(name, template)
    {
        const regexp = '<!--\\sb\\[' + name + '\\]\\s\\{\\s-->.+<!--\\s\\}\\sb\\[' + name + '\\]\\s-->';
        let match = template.match(new RegExp(regexp, 'gms'));
        return match !== null ? match[0] : "";
    }
    
    make(path, data, onlyBlock)
    {
        return new Promise((resolve, reject) => {
            $.get(path, template => {
                let result = this.makeTemplate(template, data, onlyBlock);
                resolve(result);
            });
        });
    }

    makeTemplate(template, data, onlyBlock)
    {
        if (onlyBlock !== undefined) {
            template = this.getBlockTemplate(onlyBlock, template);
        }
        for (let name in data) {
            let value = data[name];
            template = this.blockReplace(name, value, template);
        }
        return this.skipTemplateTags(template);
    }
    
    blockReplace(name, data, template)
    {
        let blockTemplate = this.getBlockTemplate(name, template);
        let blockMaked = blockTemplate;
        
        // remove block
        if (data === false) {
            return template.replace(blockMaked, "");
        }
        
        const isMultiple = data instanceof Array && data[0] !== undefined;
        
        // prepare
        if (isMultiple) {
            blockMaked = "";
            for (let key in data) {
                let value = data[key];
                if (typeof(value) == "object") {
                    blockMaked += this.blockReplace(name, value, blockTemplate);
                }
            }
        } else {
            for (let key in data) {
                let value = data[key];
                // prepare sub block
                if (typeof(value) == "object" || value === false) {
                    blockMaked = this._blockReplace(key, value, blockMaked);
                } else { // replace mask on value
                    blockMaked = this.replaceAll('<!-- v[' + key + '] -->', value, blockMaked);
                }
            }
        }
        
        // replace block
        template = this.replaceAll(blockTemplate, blockMaked, template);
        
        return template;
    }

    skipTemplateTags(content)
    {
        const regexp = /<!--(\s\}|)\s[bv]\[[^\]]+\]\s(\{\s|)-->/;
        return content.replace(new RegExp(regexp, "gms"), "");
    }

    replaceAll(find, repl, str)
    {
        const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return str.replace(new RegExp(escapeRegExp(find), 'g'), repl);
    }
}