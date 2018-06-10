/*********************************************************
 * A Trie tree implementation, with insert() and search().
 *********************************************************/
function Trie(ch) {
    this.ch = ch;
    this.word = '';
    this.children = {};  // other child Trie nodes
}

/**
 * For debug purpose.
 */
Trie.prototype.print = function(indent) {
    var lineSign = '<br/>';
    var spaceSign = '&nbsp&nbsp';

    var space = new Array(indent + 1).join(spaceSign);
    var ret = [];
    ret.push(space + this.ch + ':[' + this.word + ']');
    for (var k in this.children) {
        ret.push(this.children[k].print(indent + 1));
    }
    return ret.join(lineSign);
}

/**
 * Insert new word
 * @param inputWord String the input word to insert.
 * @param index int the only letter in index position to insert.
 */
Trie.prototype.insert = function(inputWord, index) {
    if (index >= inputWord.length) {
        // already reach the end
        return;
    }

    var ch = inputWord.charAt(index);
    if (!(ch in this.children)) {
        // insert new node
        this.children[ch] = new Trie(ch);
    }

    var t = this.children[ch];
    if (index + 1 == inputWord.length) {
        t.word = inputWord;
    } else {
        t.insert(inputWord, index + 1);
    }
}

/**
 * Find the next matched word in a given node.
 */
Trie.prototype.nextWord = function() {
    if (this.word != '') {
        return this.word;
    }
    for (var key in this.children) {
        return this.children[key].nextWord();
    }

    console.log('SHOULD NOT HAPPEN: this Trie contains an invalid leaf');
    return NaN;
}

/**
 * Find the matched word in given node.
 *   1) match the longest word
 *   2) if no match, find the closest word in the tree
 *
 * @param word String, the input word
 * @param index int, the index position of word to start match
 * @param matchedWord String, the matched word so far
 * @return [int index of input word to match, String matched word]
 */
Trie.prototype._searchHelp = function(word, index, matchedWord) {
    if (this.word != '') {
        // find a new match, update the matchWord
        matchedWord = this.word;
    }

    if (index >= word.length) {
        if (!matchedWord) {
            return [index, this.nextWord()];
        }
        return [index, matchedWord];
    }

    var ch = word.charAt(index);
    if (ch in this.children) {
        var t = this.children[ch];
        return t._searchHelp(word, index + 1, matchedWord);
    }
    // leaf node
    return [index, matchedWord];
}

/**
 * Search and update the input word
 * @param inputWord String the input word
 * @return Array of [matched word, updated input word]
 */
Trie.prototype.searchAndUpdate = function(inputWord) {
    var segs = this._searchHelp(inputWord, 0, '');
    var matchedIndex = segs[0];
    var matchedWord = segs[1];

    var remainInput = inputWord;
    if (matchedIndex < inputWord.length) {
        remainInput = inputWord.substr(0, matchedIndex) + '\'' + inputWord.substr(matchedIndex, inputWord.length - matchedIndex);
    }

    return [matchedWord, remainInput];
}


/********************
 * web input method
 ********************/
var WebInputMethod = 
{
    hanzi: '',  // matched characters
    originalPinyin: '',  // input pinyin from user
    pinyin: '',  // the string in pinyin section
    result: [],  // the matched characters result
    pageCurrent: 1,  // current page
    pageSize: 9,  // page size
    pageCount: 0,  // total page count

    /**
     * Init dictionary
     */
    initDict: function() {
        if (!pinyin_dict) {
            throw 'no dictionary file';
        }

        this.trie = new Trie('_');
        for (var pinyin in pinyin_dict) {
            this.trie.insert(pinyin, 0);
        }

        // document.getElementById('debug').innerHTML = this.trie.print(0);
    },
    /**
     * Init input method dom events
     */
    initDom: function() {
        var dom = document.querySelector('#web_input_method');
        var that = this;
        // handle the click event in input method box
        dom.addEventListener('click', function(e) {
            var target = e.target;
            if(target.nodeName == 'LI') that.chooseCharacter(parseInt(target.dataset.idx));
            else if(target.nodeName == 'SPAN') {
                if(target.className == 'page-up' && that.pageCurrent > 1) {
                    that.pageCurrent--;
                    that.refreshPage();
                } else if(target.className == 'page-down' && that.pageCurrent < that.pageCount) {
                    that.pageCurrent++;
                    that.refreshPage();
                }
            }
        });
    },

    /**
     * Init keyboard related elements
     */
    initKeyboard: function() {
        // the button to show or hide the virtual keyword
        var showKeyboardButton = document.querySelector('.show_keyboard');
        showKeyboardButton.addEventListener('click', function(){
            var elem = document.querySelector('.virtual_keyboard');
            if (elem.style.display == 'block') {
                elem.style.display = 'none';
            } else {
                elem.style.display = 'block';
            }
        });

        var that = this;
        var input=document.querySelectorAll('.virtual_keyboard p input');
        for (var i = 0; i < input.length; i++) {
            input[i].addEventListener('click', function() {
                var inputChar = this.value;
                console.log(inputChar);
                if (inputChar >= 'A' && inputChar <= 'Z') {
                    // A-Z
                    that.addChar(inputChar.toLowerCase());
                } else if (inputChar == '<-' && that.pinyin) {
                    // del
                    that.delChar();
                }
            });
        };
    },

    /**
     * Init all
     */
    initAll: function() {
        this.initDict();
        this.initDom();
        this.initKeyboard();
        this._target = document.querySelector('#web_input_method');
        this._pinyinTarget = document.querySelector('#web_input_method .pinyin');
        this._resultTarget = document.querySelector('#web_input_method .result ol');
        var that = this;
        var editbox = document.querySelector('#textarea_id');
        this._input = editbox;

        editbox.addEventListener('keydown', function(e) {
            var keyCode = e.keyCode;
            var preventDefault = false;
            if (e.ctrlKey || e.metaKey) {
                console.log(keyCode);
            } else if (keyCode >= 65 && keyCode <= 90) {
                // A-Z
                that.addChar(String.fromCharCode(keyCode+32));
                preventDefault = true;
            } else if (keyCode == 8 && that.pinyin) {
                // del
                that.delChar();
                preventDefault = true;
            } else if (keyCode >= 48 && keyCode <= 57 && !e.shiftKey && that.pinyin) {
                // 1-9
                that.chooseCharacter(keyCode-48);
                preventDefault = true;
            } else if (keyCode == 32 && that.pinyin) {
                // space
                that.chooseCharacter(1);
                preventDefault = true;
            } else if (keyCode == 33 && that.pageCount > 0 && that.pageCurrent > 1) {
                // page-up
                that.pageCurrent--;
                that.refreshPage();
                preventDefault = true;
            } else if (keyCode == 34 && that.pageCount > 0 && that.pageCurrent < that.pageCount) {
                // page-down
                that.pageCurrent++;
                that.refreshPage();
                preventDefault = true;
            }

            if (preventDefault) {
                e.preventDefault();
            }
        });
        editbox.addEventListener('focus', function() {
            // hide input method if not in the input box
            if (that._input !== this) {
                that.hide();
            }
        });
    },

    /**
     * Convert pinyin to Hanzi
     * @param pinyin String: input pinyin
     * @return [[matched character] Array, modified pinyin string] Array
     */
    pinyinToHanzi: function(pinyin) {
        var arr = this.trie.searchAndUpdate(pinyin);
        var matchedPinyin = arr[0];
        var remainPinyin = arr[1];

        if (!matchedPinyin) {
            return [[], pinyin];
        }

        // console.log(arr);
        var matchedCharacter = pinyin_dict[matchedPinyin];
        return [matchedCharacter.split('|'), remainPinyin];
    },

    /**
     * choose one character
     * @param index int the index in the result
     */
    chooseCharacter: function(index) {
        var newCharacter = this.result[(this.pageCurrent - 1) * this.pageSize + index - 1];
        if (!newCharacter) {
            return;
        }

        // update this.hanzi and this.pinyin
        this.hanzi += newCharacter;
        var idx = this.pinyin.indexOf('\'');
        if (idx > 0) {
            this.pinyin = this.pinyin.substr(idx+1);
            this.refreshBox();
        } else {
            // completed
            this._input.value += this.hanzi;
            this.hide();
        }
    },
    /**
     * refresh the box
     */
    refreshBox: function() {
        var arr = this.pinyinToHanzi(this.pinyin.replace(/'/g, ''));
        this.result = arr[0];
        this.pinyin = arr[1];
        var count = this.result.length;
        this.pageCurrent = 1;
        this.pageCount = Math.ceil(count / this.pageSize);
        this._pinyinTarget.innerHTML = this.hanzi + this.pinyin;
        this.refreshPage();
    },
    /**
     * refresh the page in the character result
     */
    refreshPage: function() {
        var htmlArr = [];
        var chArr = this.result.slice((this.pageCurrent-1)*this.pageSize, this.pageCurrent*this.pageSize);
        for (var i = 0; i < chArr.length; i++) {
            htmlArr.push('<li data-idx="' + (i+1) + '">' + chArr[i] + '</li>');
        }
        this._target.querySelector('.page-up').style.opacity = this.pageCurrent > 1 ? '1' : '.3';
        this._target.querySelector('.page-down').style.opacity = this.pageCurrent < this.pageCount ? '1' : '.3';
        this._resultTarget.innerHTML = htmlArr.join('');
    },
    addChar: function(ch) {
        if (this.pinyin.length == 0) {
            this.show();
        }
        this.originalPinyin += ch;
        this.pinyin = this.originalPinyin;
        this.refreshBox();
    },
    delChar: function() {
        if(this.pinyin.length <= 1)
        {
            this.hide();
            return;
        }
        this.originalPinyin = this.originalPinyin.substr(0, this.originalPinyin.length-1);
        this.pinyin = this.originalPinyin;
        this.refreshBox();
    },
    show: function() {
        this._target.style.display = 'block';
    },
    hide: function() {
        this.reset();
        this._target.style.display = 'none';
    },
    reset: function() {
        this.hanzi = '';
        this.originalPinyin = '';
        this.pinyin = '';
        this.result = [];
        this.pageCurrent = 1;
        this.pageCount = 0;
        this._pinyinTarget.innerHTML = '';
    }
};