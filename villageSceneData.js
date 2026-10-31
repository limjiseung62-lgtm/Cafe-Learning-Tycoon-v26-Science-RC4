export const sceneSize = { width: 1600, height: 1200 };
export const townScene = {
    "id": "town",
    "name": "햇살 골목 마을",
    "start": "plaza",
    "buildings": [
        {
            "id": "cafe",
            "name": "1호점 카페",
            "tile": 0,
            "x": 330,
            "y": 390,
            "w": 300,
            "stage": 1,
            "door": {
                "x": 330,
                "y": 402
            },
            "footprint": {
                "x": 219,
                "y": 342,
                "w": 222,
                "h": 48
            }
        },
        {
            "id": "flowers",
            "name": "소담의 꽃집",
            "tile": 1,
            "x": 775,
            "y": 340,
            "w": 290,
            "stage": 1,
            "door": {
                "x": 775,
                "y": 352
            },
            "footprint": {
                "x": 667.7,
                "y": 293.6,
                "w": 214.6,
                "h": 46.4
            }
        },
        {
            "id": "market",
            "name": "다온의 시장",
            "tile": 2,
            "x": 1270,
            "y": 400,
            "w": 320,
            "stage": 1,
            "door": {
                "x": 1270,
                "y": 412
            },
            "footprint": {
                "x": 1151.6,
                "y": 348.8,
                "w": 236.8,
                "h": 51.2
            }
        },
        {
            "id": "mill",
            "name": "보리의 제분소",
            "tile": 3,
            "x": 300,
            "y": 990,
            "w": 290,
            "stage": 1,
            "door": {
                "x": 300,
                "y": 1002
            },
            "footprint": {
                "x": 192.7,
                "y": 943.6,
                "w": 214.6,
                "h": 46.4
            }
        },
        {
            "id": "workshop",
            "name": "윤슬의 공방",
            "tile": 4,
            "x": 1080,
            "y": 1000,
            "w": 300,
            "stage": 1,
            "door": {
                "x": 1080,
                "y": 1012
            },
            "footprint": {
                "x": 969,
                "y": 952,
                "w": 222,
                "h": 48
            }
        },
        {
            "id": "pavilion",
            "name": "주민 모임집",
            "tile": 5,
            "x": 1330,
            "y": 740,
            "w": 235,
            "stage": 1,
            "door": {
                "x": 1330,
                "y": 752
            },
            "footprint": {
                "x": 1243.05,
                "y": 702.4,
                "w": 173.9,
                "h": 37.6
            }
        },
        {
            "id": "house-a",
            "name": "주민 골목",
            "tile": 6,
            "x": 180,
            "y": 665,
            "w": 235,
            "stage": 1,
            "door": {
                "x": 180,
                "y": 677
            },
            "footprint": {
                "x": 93.05,
                "y": 627.4,
                "w": 173.9,
                "h": 37.6
            }
        },
        {
            "id": "house-b",
            "name": "작은 주택",
            "tile": 8,
            "x": 1400,
            "y": 1090,
            "w": 225,
            "stage": 1,
            "door": {
                "x": 1400,
                "y": 1102
            },
            "footprint": {
                "x": 1316.75,
                "y": 1054,
                "w": 166.5,
                "h": 36
            }
        }
    ],
    "nodes": {
        "cafe": [
            330,
            402
        ],
        "flowers": [
            775,
            352
        ],
        "market": [
            1270,
            412
        ],
        "mill": [
            300,
            1002
        ],
        "workshop": [
            1080,
            1012
        ],
        "pavilion": [
            1330,
            752
        ],
        "house-a": [
            180,
            677
        ],
        "house-b": [
            1400,
            1102
        ],
        "plaza": [
            680,
            720
        ],
        "west": [
            420,
            650
        ],
        "east": [
            1140,
            650
        ],
        "park": [
            640,
            1010
        ],
        "south": [
            780,
            1070
        ],
        "exit": [
            1515,
            620
        ]
    },
    "edges": [
        [
            "cafe",
            "west"
        ],
        [
            "west",
            "plaza"
        ],
        [
            "flowers",
            "plaza"
        ],
        [
            "plaza",
            "east"
        ],
        [
            "east",
            "market"
        ],
        [
            "east",
            "pavilion"
        ],
        [
            "west",
            "house-a"
        ],
        [
            "west",
            "mill"
        ],
        [
            "mill",
            "park"
        ],
        [
            "park",
            "south"
        ],
        [
            "south",
            "workshop"
        ],
        [
            "workshop",
            "house-b"
        ],
        [
            "south",
            "plaza"
        ],
        [
            "east",
            "exit"
        ]
    ],
    "residents": [
        [
            "guide",
            "여울",
            "bookworm",
            660,
            650
        ],
        [
            "bloom",
            "소담",
            "painter",
            810,
            395
        ],
        [
            "vendor",
            "다온",
            "traveler",
            1250,
            465
        ],
        [
            "miller",
            "보리",
            "gentleman",
            340,
            1030
        ],
        [
            "maker",
            "윤슬",
            "office",
            1095,
            1045
        ],
        [
            "host",
            "해솔",
            "fashion",
            1180,
            710
        ]
    ]
};
export const lakeScene = {
    "id": "lake",
    "name": "바람결 호숫가",
    "start": "landing",
    "buildings": [
        {
            "id": "kiosk",
            "name": "산책로 상점",
            "tile": 7,
            "x": 1275,
            "y": 360,
            "w": 300,
            "stage": 1,
            "door": {
                "x": 1275,
                "y": 372
            },
            "footprint": {
                "x": 1164,
                "y": 312,
                "w": 222,
                "h": 48
            }
        },
        {
            "id": "cottage",
            "name": "물빛 주택",
            "tile": 8,
            "x": 340,
            "y": 1050,
            "w": 255,
            "stage": 1,
            "door": {
                "x": 340,
                "y": 1062
            },
            "footprint": {
                "x": 245.65,
                "y": 1009.2,
                "w": 188.7,
                "h": 40.800000000000004
            }
        },
        {
            "id": "lake-house",
            "name": "이웃의 집",
            "tile": 6,
            "x": 1390,
            "y": 805,
            "w": 240,
            "stage": 1,
            "door": {
                "x": 1390,
                "y": 817
            },
            "footprint": {
                "x": 1301.2,
                "y": 766.6,
                "w": 177.6,
                "h": 38.4
            }
        },
        {
            "id": "site",
            "name": "2호점 예정 부지",
            "tile": 0,
            "x": 1120,
            "y": 1110,
            "w": 320,
            "stage": 1,
            "door": {
                "x": 1120,
                "y": 1122
            },
            "footprint": {
                "x": 1001.6,
                "y": 1058.8,
                "w": 236.8,
                "h": 51.2
            }
        }
    ],
    "nodes": {
        "kiosk": [
            1275,
            372
        ],
        "cottage": [
            340,
            1062
        ],
        "lake-house": [
            1390,
            817
        ],
        "site": [
            1120,
            1122
        ],
        "landing": [
            930,
            930
        ],
        "photo": [
            540,
            950
        ],
        "lookout": [
            1020,
            640
        ],
        "bridge": [
            1025,
            280
        ],
        "bridgeWest": [
            930,
            280
        ],
        "bridgeEast": [
            1120,
            280
        ],
        "north": [
            775,
            180
        ],
        "northWest": [
            400,
            145
        ],
        "westTop": [
            145,
            180
        ],
        "west": [
            145,
            380
        ],
        "south": [
            700,
            1080
        ],
        "east": [
            1300,
            625
        ],
        "entry": [
            1490,
            1100
        ]
    },
    "edges": [
        [
            "landing",
            "photo"
        ],
        [
            "photo",
            "cottage"
        ],
        [
            "photo",
            "south"
        ],
        [
            "south",
            "site"
        ],
        [
            "site",
            "entry"
        ],
        [
            "site",
            "lake-house"
        ],
        [
            "lake-house",
            "east"
        ],
        [
            "east",
            "kiosk"
        ],
        [
            "east",
            "lookout"
        ],
        [
            "lookout",
            "landing"
        ],
        [
            "lookout",
            "bridgeEast"
        ],
        [
            "bridgeEast",
            "bridge"
        ],
        [
            "bridge",
            "bridgeWest"
        ],
        [
            "bridgeWest",
            "north"
        ],
        [
            "north",
            "northWest"
        ],
        [
            "northWest",
            "westTop"
        ],
        [
            "westTop",
            "west"
        ]
    ],
    "residents": [
        [
            "keeper",
            "온유",
            "gentleman",
            960,
            950
        ],
        [
            "seller",
            "마루",
            "traveler",
            1285,
            405
        ],
        [
            "photographer",
            "빛나",
            "painter",
            545,
            1000
        ],
        [
            "visitor",
            "다솔",
            "bookworm",
            1080,
            690
        ]
    ]
};
