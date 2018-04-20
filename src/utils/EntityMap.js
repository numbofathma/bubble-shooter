const EntityMap = {
    empty: null,
    outOfBounds: -1,
    zero: 0,
    // Colors
    COLOR_START: 1,
    COLOR_END: 9,
    BUBBLE_START: 1,
    BUBBLE_END: 8,
    red: 1,
    blue: 2,
    green: 3,
    yellow: 4,
    purple: 5,
    skyBlue: 6,
    orange: 7,
    pink: 8,
    white: 9,
    rainbow: 10,
    gold: 11,
    colors: {
        1: 'red',
        2: 'blue',
        3: 'green',
        4: 'yellow',
        5: 'purple',
        6: 'skyBlue',
        7: 'orange',
        8: 'pink',
        9: 'white',
        10: 'rainbow',
        11: 'gold'
    },

    // Game Objects
    GAME_OBJECT_START: 50,
    GAME_OBJECT_END: 55,
    tile: 50,
    polnareff: 51,
    launcher: 52,
    bubble: 53,
    block: 54,
    halfBlock: 55,
    gameObjects: {
        50: 'tile',
        51: 'polnareff',
        52: 'launcher',
        53: 'bubble',
        54: 'block',
        55: 'halfBlock'
    }
};

// to make the map easier to read
const AlphabetizedMap = {
    _: null,
    x: -1,
    a: 0,
    // Colors
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
    i: 8,
    j: 9,
    k: 10,
    l: 11,

    // Game Objects
    A: 50,
    B: 51,
    C: 52,
    D: 53,
    E: 54,
    F: 55
};

export {EntityMap, AlphabetizedMap};