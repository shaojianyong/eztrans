import { TestBed, inject } from '@angular/core/testing';

import { BaiduFanyiService } from './baidu-fanyi.service';

describe('BaiduFanyiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaiduFanyiService]
    });
  });

  it('should be created', inject([BaiduFanyiService], (service: BaiduFanyiService) => {
    expect(service).toBeTruthy();
  }));
});


/*
{
  "trans_result": {
    "from": "en",
    "to": "zh",  // zh-cn
    "domain": "all",
    "type": 2,
    "status": 0,
    "data": [
      {
        "dst": "早上好!",
        "prefixWrap": 0,
        "src": "Good morning!",
        "relation": [],
        "result": [
          [
            0,
            "早上好!",
            [
              "0|13"
            ],
            [],
            [
              "0|13"
            ],
            [
              "0|10"
            ]
          ]
        ]
      }
    ],
    "phonetic": [
      {
        "src_str": "早",
        "trg_str": "zǎo"
      },
      {
        "src_str": "上",
        "trg_str": "shang"
      },
      {
        "src_str": "好",
        "trg_str": "hǎo"
      },
      {
        "src_str": "!",
        "trg_str": " "
      }
    ],
    "keywords": [
      {
        "means": [
          "早安，你好",
          "再会"
        ],
        "word": "Good morning"
      }
    ]
  },
  "dict_result": [],
  "liju_result": {
    "double": "...",
    "tag": [
      "早安"
    ],
    "single": "...",
  }
  "logid": 2453174682
}
*/
