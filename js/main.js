'use strict';

{
  // --------------------------------------------
  // 各マス目の処理
  // --------------------------------------------
  class Box {
    constructor(board) {
      this.board = board;
      this.status = 'blank';
      this.el = document.createElement('button');
      this.el.classList.add('button');
      this.el.addEventListener('click', () => {
        this.click();
      });
      this.el.textContent = '●';
      this.sound = new Audio("audio/put.mp3");
    }

    click() {
      // 駒を置いた後はボタン押下無効
      if (this.el.classList.contains('disabled')) {
        return;
      }
      this.setDisabled();
      this.setBox('red');
      this.board.blankToDisabled();
      if (this.board.gameset() === false) {
        // 自分(赤)の番は終わったので青の処理へ
        this.board.nextTime();
      } else {
        this.board.nextStage();
      }
    }

    getElement() {
      return this.el;
    }

    getStatus() {
      return this.status;
    }

    setBox(color) {
      this.el.classList.add(color);
      this.status = color;
      this.sound.play();
    }

    clearBox() {
      this.el.classList.remove('blue');
      this.el.classList.remove('red');
      this.status = 'blank';
    }

    setDisabled() {
      this.el.classList.add('disabled');
    }

    setAbled() {
      this.el.classList.remove('disabled');
    }
  }

  // --------------------------------------------
  // 盤面の処理
  // --------------------------------------------
  class Board {
    constructor() {
      // 3列が並ぶ全パターン
      this.patterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      // [0] [1] [2]
      // [3] [4] [5]
      // [6] [7] [8]
      this.boxes = [];
      this.zero = '';
      this.one = '';
      this.two = '';
      this.fixed;
      this.precede;
      this.system = document.getElementById('precede');
      this.start = document.querySelector('.start');
      // 初期設定
      this.setup();
    }

    setup() {
      // 各マス目(box)のインスタンス作成
      for (let i = 0; i < 9; i++) {
        this.boxes.push(new Box(this));
      }
      const board = document.getElementById('board');
      // ボード配下に各マス目を配置
      this.boxes.forEach(box => {
        board.appendChild(box.getElement());
      });
      this.start.textContent = 'スタート';
      this.start.addEventListener('click', () => {
        this.fight();
      });

      this.sadSound = new Audio("audio/sad.mp3");
      this.yeshSound = new Audio("audio/yeah.mp3");
      this.drawSound = new Audio("audio/draw.mp3");
    }

    preView() {
      this.precede = Math.floor(Math.random() * 2);
      if (this.precede === 0) {
        this.system.textContent = 'あなた(赤)が先行です'
      } else {
        this.system.textContent = 'AI(青)が先行です'
      }
      this.start.classList.remove('dnone');
      this.blankToDisabled();
    }

    fight() {
      this.boxes.forEach(box => {
        box.clearBox();
      });
      this.start.classList.add('dnone')
      this.messageOff();
      if (this.precede === 1) {
        this.blueTime();
      } else {
        this.disabledToBlank();
      }
    }

    nextTime() {
      setTimeout( () => {
        this.blueTime();
      }, 2000);
    }

    blueTime() {
      for (let i = 0; i < this.patterns.length; i++) {
        this.patternSet(i);
        // 自分の三個目の駒を置ける場合は最優先
        const result = this.finish();
        if (result !== undefined ) {
          this.fixed(this.patterns[i][result]);
          if (this.gameset() === true) {
            this.nextStage();
          }
          return;
        }
      }

      for (let i = 0; i < this.patterns.length; i++) {
        this.patternSet(i);
        // 相手(赤)が２つ並んでいるときは阻止を優先
        const result = this.blocking();
        if (result !== undefined ) {
          this.fixed(this.patterns[i][result]);
          if (this.gameset() === true) {
            this.nextStage();
          }
          return;
        }
      }

      for (let i = 0; i < this.patterns.length; i++) {
        this.patternSet(i);
        // 自分(青)が１つだけの場合は３マスになるところに置く
        const result = this.side();
        if (result !== undefined ) {
          this.fixed(this.patterns[i][result]);
          if (this.gameset() === true) {
            this.nextStage();
          }
          return;
        }
      }

      let blank = [];
      this.boxes.forEach((box, i) => {
        if (box.getStatus() === 'blank') {
          blank.push(i);
        }
      });
      // 空いているboxからランダムに選ぶ
      const fixed = blank[Math.floor(Math.random() * blank.length)];
      this.fixed(fixed);
      if (this.gameset() === true) {
        this.nextStage();
      }
    }

    patternSet(i) {
      this.zero = this.boxes[this.patterns[i][0]].getStatus();
      this.one = this.boxes[this.patterns[i][1]].getStatus();
      this.two = this.boxes[this.patterns[i][2]].getStatus();
    }

    messageOff() {
      this.system.textContent = '';
    }

    gameset() {
      for (let i = 0; i < this.patterns.length; i++) {
        this.patternSet(i);
        // ３マス揃っていたらゲーム終了
        if (this.gamesetWin() === true) {
          // this.start.classList.remove('dnone');
          return true;
        }
      }

      let cnt = 0;
      this.boxes.forEach(box => {
        if (box.getStatus() === 'blank') {
          cnt++;
        }
      });
      if ( cnt === 0) {
        this.system.textContent = '引き分けです。';
        this.drawSound.play();
        return true;
      } else {
        // まだ空きがある
        return false;
      }
    }

    gamesetWin() {
      if (this.zero === 'blue' && this.one === 'blue' && this.two === 'blue') {
        this.system.textContent = 'AIが勝ちました。';
        this.sadSound.play();
      } else if (this.zero === 'red' && this.one === 'red' && this.two === 'red') {
        this.system.textContent = 'あなたが勝ちました。';
        this.yeshSound.play();
      } else {
        return false;
      }
      return true;
    }

    nextStage() {
      // ４秒後に最初の画面に戻る
      setTimeout( () => {
        this.preView();
      }, 4000);
    }

    // 置くマス目の処理
    fixed(fixed) {
      this.boxes[fixed].setBox('blue');
      this.boxes[fixed].setDisabled();
      this.disabledToBlank();
    }

    finish() {
      // 三つ目の駒を置けるのでこれで最後 
      if (this.zero === 'blue' && this.one === 'blue' && this.two === 'blank') {
        // 次の一手はまだ置いてないマス
        return 2;
      }
      if (this.zero === 'blue' && this.two === 'blue' && this.one === 'blank') {
        return 1;
      }
      if (this.one === 'blue' && this.two === 'blue' && this.zero === 'blank') {
        return 0;
      }
      return undefined;
    }

    blocking() {
      // 相手(赤)が２つ並んでいるときは最優先で阻止
      if (this.zero === 'red' && this.one === 'red' && this.two === 'blank') {
        return 2;
      }
      if (this.zero === 'red' && this.two === 'red' && this.one === 'blank') {
        return 1;
      }
      if (this.one === 'red' && this.two === 'red' && this.zero === 'blank') {
        return 0;
      }
      return undefined;
    }

    side() {
      // ３マスになるどちらかを選ぶ
      let box = [];
      if (this.zero === 'blue' && this.one === 'blank' && this.two === 'blank') {
        box.push(1);
        box.push(2);
      } else if (this.zero === 'blank' && this.one === 'blue' && this.two === 'blank') {
        box.push(0);
        box.push(2);
      } else if (this.zero === 'blank' && this.one === 'blank' && this.two === 'blue') {
        box.push(0);
        box.push(1);
      } else {
        return undefined;
      }
      const fixed = Math.floor(Math.random() * 2);
      return box[fixed];
    }

    blankToDisabled() {
      this.boxes.forEach(box => {
        if (box.getStatus() === 'blank') {
          box.setDisabled();
        }
      });
    }

    disabledToBlank() {
      this.boxes.forEach(box => {
        if (box.getStatus() === 'blank') {
          box.setAbled();
        }
      })
    }

  }
  
  
  const game = new Board();
  game.preView();
  

}