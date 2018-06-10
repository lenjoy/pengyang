# -*- coding: utf-8 -*-
# Run with python2

import csv


with open('wenzhou_pinyin_20180608.csv', 'r') as csvfile:
    r = csv.reader(csvfile, delimiter=',')
    # the head format should be: character,phrase,meaning,pinyin,wenzhouhua,shengmu,yunmu,verify
    head = r.next()
    # print head
    character_index = 0
    pinyin_index = 4
    assert head[character_index] == 'character'
    assert head[pinyin_index] == 'wenzhouhua'
    m = {}
    for row in r:
        pinyin = row[pinyin_index]
        character = row[character_index]
        if pinyin not in m:
            m[pinyin] = {character: True}
        else:
            m[pinyin][character] = True

    arr = []
    pinyinArr = m.keys()
    pinyinArr.sort()
    for pinyin in pinyinArr:
        arr.append('\'{}\': \'{}\''.format(pinyin, '|'.join(m[pinyin].keys())))
    print 'var pinyin_dict = {\n' + ',\n'.join(arr) + '\n};'

        
    # unicode(row[character_index], 'utf-8').encode('utf-8')
