// vwとvhを取得
let ww = window.innerWidth;
let wh = window.innerHeight;
console.log(ww, wh);

// cssのIDタグの取得
const gazeel = document.querySelector("#gazer");
const targetel = document.querySelector("#target");
const faceel = document.querySelector("#webgazerVideoContainer");
//var videoElem1 = document.getElementById("video1");
//var videoElem2 = document.getElementById("video2");
//var videoElem3 = document.getElementById("video3");
//var videoElem4 = document.getElementById("video4");

var s1v1 = document.getElementById("s1v1");
var s1v2 = document.getElementById("s1v2");
var s2v1 = document.getElementById("s2v1");
var s2v2 = document.getElementById("s2v2");
var s2v3 = document.getElementById("s2v3");
var s2v4 = document.getElementById("s2v4");
var s3v1 = document.getElementById("s3v1"); //loop前
var s3v2 = document.getElementById("s3v2"); //loop
var s3v3 = document.getElementById("s3v3"); //失敗
var s3v4 = document.getElementById("s3v4"); //成功






var videoElemStart = document.getElementById("start");
var imgElemWhite = document.getElementById("white");
var imgElemBlack = document.getElementById("black");
var videoElemEnd = document.getElementById("end");

const tvel = new Array(9);
for (let i = 0; i < 9; i++) {
  tvel[i] = document.getElementById("tv" + String(i));
}
var tvinfo = new Array(9);
// set
x = 0;
y = 0;
w = 100 / 9;
h = 100;
// draw
x = ww * (x / 100);
y = wh * (y / 100);
w = ww * (w / 100);
h = wh * (h / 100);
for (let i = 0; i < 9; i++) {
  tvel[i].style.left = x + (i / 9) * ww + "px";
  tvel[i].style.top = y + "px";
  tvel[i].style.width = w + "px";
  tvel[i].style.height = h + "px";
  tvinfo[i] = [x + ((i + 2) / 13) * ww, y, w, h];
}
var tvplay = new Array(9).fill(false); //タイトルが落ちるシーンで使う
var tvpause = new Array(9).fill(true);

// 視線位置のqueueNum回の平均を計算するための準備
const queue = []; // キューの初期化
const queueNum = 10; // キューの要素数の上限
var xsum = 0;
var ysum = 0;

// target領域にどのくらい継続して入っているかを計測するための準備
const inRegionList = []; // キューの初期化
const inRegionListNum = 100; // キューの要素数の上限

// scene番号を管理
var sceneNum = 7;
var scene = 0;// 0->生姜  1,2->ろうそく 3->ジェンガ導入 4->ジェンガループ 5->ジェンガループ　6->タイトル

// 初期設定
var xtarget;
var ytarget;
var wtarget;
var htarget;
var elapsedTimeOld = 0;
var nobody = 0;
var nowStatus = "START";
var loopCount = 0;
var timeStart = 0;
var calib = 0;  //web キャリブレーションしている？　0していない
var noCalibration = true; //キャリブレーションしているかどうか　true = していない　　　web:キャリブレーションしたかどうか　true = したことがない

setTarget();
muteAllVideos();

// セットしてるけど多分動いてない
webgazer.setTracker("tracking.js"); //set a tracker module

// 視線推定に線形回帰を利用
webgazer.setRegression("WeightedRidge");

webgazer
  .setGazeListener(function (data, elapsedTime) {
    // フレームレートを計算
    const dt = (elapsedTime - elapsedTimeOld) / 1000;
    elapsedTimeOld = elapsedTime;

    if (data == null) {
      // 誰もいなかったら
      if (nobody < 10000) {
        nobody += 1;
        //console.log(nobody);
        checkSomeoneHere(10, dt);
      }
      return;
    } else {
      // 誰かいたら
      nobody = 0;
      if (scene % sceneNum != 6) {
        for (let i = 0; i < 9; i++) {
          tvplay[i] = false;
          tvpause[i] = true;
        }
      }
    }

    // 視線推定
    const xprediction = data.x; //these x coordinates are relative to the viewport
    const yprediction = data.y; //these y coordinates are relative to the viewport

    queue.push([xprediction, yprediction]); // 視線位置をqueueに入れる
    xsum += xprediction;
    ysum += yprediction;
    // 要素数の上限を超えたら
    if (queue.length > queueNum) {
      const predictionold = queue.shift(); // 視線位置をqueueから取り出す
      xsum -= predictionold[0];
      ysum -= predictionold[1];
    }

    // 直近queueNum回の視線位置の平均
    var xAverage = xsum / queueNum;
    var yAverage = ysum / queueNum;
    // 画面外に視線推定がいくのを防ぐ
    if (xAverage < 0) {
      xAverage = 0;
    } else if (xAverage > ww - 40) {
      xAverage = ww - 40;
    }
    if (yAverage < 0) {
      yAverage = 0;
    } else if (yAverage > wh - 40) {
      yAverage = wh - 40;
    }

    // target領域に入っているかの判定をqueueに入れる
    inRegionList.push(
      inRegion(xAverage, yAverage, xtarget, ytarget, wtarget, htarget)
    );

    // start
    if (nowStatus == "START" && data != null) {
      imgElemBlack.style.opacity = 0;
      videoElemStart.play();
    }

    // calibration
    if (nowStatus == "CALIBRATION") {
      imgElemWhite.style.opacity = 1;
      if(noCalibration) //キャリブレーションしたことがない
      {
        imgElemWhite.src = "asset/WHITE3.png";
        gazeel.style.opacity = 0.5;
        if(calib == 0) //キャリブレーションしていない
        {
          calibration();  //強制キャリブレーション 
        }
        
      }
      else{
        imgElemWhite.src = "asset/WHITE2.png";
      }
      
      //キーを押してキャリブレーションしている場合、5秒後にシーンを切り替えない
      //if (!noCalibration) { 
      //  timeStart = new Date();
      //}
    }

    // scene6
    if (nowStatus == "MOVIE") {
      // scene6:文字が落ちる仕掛け
      for (let i = 0; i < 9; i++) {
        if (
          (scene % sceneNum == 6) &
          inRegion(
            xAverage,
            yAverage,
            tvinfo[i][0],
            tvinfo[i][1],
            tvinfo[i][2],
            tvinfo[i][3]
          ) &
          (tvplay[i] == false)
        ) {
          tvel[i].play();
        }
      }
      // scene6:全部の文字が一度は落ち切ったら最初に戻る
      if (isAllTrue(tvplay)) {
        for (let i = 0; i < 9; i++) {
          tvel[i].style.opacity = 0;
        }
        //次のループのための準備
        loadAllVideos();
        imgElemWhite.src = "asset/WHITE2.png";
        nowStatus = "END";
      }
    }

    // end
    if (nowStatus == "END") {
      videoElemEnd.style.opacity = 1;
      videoElemEnd.play();
    }

    // 要素数の上限を超えたら
    if (inRegionList.length > inRegionListNum) {
      inRegionList.shift(); // 視線位置をqueueから取り出す
    }

    // もし視線がtarget領域に入ったら
    if (
      (nowStatus == "MOVIE") &
      inRegion(xAverage, yAverage, xtarget, ytarget, wtarget, htarget)
    ) {
      gazeel.style.background = "green";

      // もし直近の視線がすべてtarget領域に入っていたら
      if (isPartlyTrue(inRegionList, dt)) {
        gazeAtTarget(); //凝視フラグ発動！！
        gazeel.style.background = "yellow";
      }
    } else {
      gazeel.style.background = "red";
    }

    // もし視線がtarget領域に入らずに一定時間経過したら（10秒に設定しています）
    const timeEnd = new Date();
    //console.log((timeEnd - timeStart) / 1000);
    if (scene % sceneNum == 1) {
      if ((nowStatus == "MOVIE") & (timeEnd - timeStart > 10 * 1000)) {
        gazeAtTarget(); //凝視フラグ強制発動！！1つ目のろうそくだけ10秒
      }
    } else if (scene % sceneNum == 6) {
      if ((nowStatus == "MOVIE") & (timeEnd - timeStart > 10 * 1000)) {
        for (let i = 0; i < 9; i++) {
          if (!tvplay[i]) {
            tvel[i].play();
            tvpause[i] = true;
          }
        }
      }
    } else {
      if ((nowStatus == "MOVIE") & (timeEnd - timeStart > 10 * 1000) & (scene % sceneNum != 4)) {
        gazeAtTarget(); //凝視フラグ強制発動！！
      }
    }
    if ((nowStatus == "CALIBRATION") & (timeEnd - timeStart > 5 * 1000) & !noCalibration) {
      //5秒後にキャリブレーションからmovieに移行 キャリブレーションした場合のみ
      imgElemWhite.style.opacity = 0;
      //MOVIEの初期化
      nowStatus = "MOVIE";
      scene = 0;
      changeMovie();

    }

    // 視線推定の点の位置座標を指定
    gazeel.style.left = xAverage - 20 + "px";
    gazeel.style.top = yAverage - 20 + "px";

    /* console.log("raw", xprediction, yprediction); */
    /* console.log("ave", xAverage, yAverage); */
    /* console.log(
      inRegion(xAverage, yAverage, xtarget, ytarget, wtarget, htarget)
      ); */
    /* console.log(inRegionList);ggg
    console.log(isAllTrue(inRegionList)); */
    //console.log(scene);
    /* console.log(dt); */
    /* console.log(nobody); */
  })
  .saveDataAcrossSessions(true)
  .removeMouseEventListeners()
  .begin();

// 視線推定学習ストップ
webgazer.removeMouseEventListeners();

// 視線gazeがtargetの中に入っているか否かの判定
function inRegion(gx, gy, tx, ty, w, h) {
  if ((tx <= gx) & (gx <= tx + w) & (ty <= gy) & (gy <= ty + h)) {
    return true;
  } else {
    return false;
  }
}

// リスト内のすべてがtrueならばtrueを返す
function isAllTrue(arr) {
  return arr.every((value) => {
    return value;
  });
}

// リスト内の直近n秒がtrueならばtrueを返す
function isPartlyTrue(arr, dt) {
  if (scene % sceneNum == 0) {
    n = 1;
  } else if (scene % sceneNum == 1) {
    n = 1;
  } else if (scene % sceneNum == 2) {
    n = 1;
  } else if (scene % sceneNum == 3) {
    n = 100;
  } else if (scene % sceneNum == 4) {
    n = 1;
  } else if (scene % sceneNum == 5) {
    n = 100;
  }

  const f = Math.ceil(n / dt); // n秒をフレームに変換
  return arr.slice(-f).every((value) => {
    return value;
  });
}

// n秒視線を検知できなかったら誰もいないと判定して映像を初期化する
function checkSomeoneHere(n, dt) {
  const f = Math.ceil(n / dt); // n秒をフレームに変換
  if (nobody > f) {
    //STARTの映像に切り替える
    videoElemStart.currentTime = 0.0;
    videoElemStart.style.opacity = 1;
    nowStatus = "START";
    muteAllVideos();
  }
}

// 凝視フラグ
function gazeAtTarget() {
  if (scene % sceneNum == 0) {
    //生姜
    s1v1.style.opacity = 0;
    s1v2.style.opacity = 1;
    s1v1.muted = true;
    s1v2.muted = false;
    s1v2.play();
    
   

  } else if (scene % sceneNum == 1) {
    //ろうそく1
    s2v1.style.opacity = 0;
    s2v2.style.opacity = 1;
    s2v1.muted = true;
    s2v2.muted = false;
    s2v2.play();



  } else if (scene % sceneNum == 2) {
    //ろうそく2
    s2v3.style.opacity = 0;
    s2v3.muted = true;
    s2v4.style.opacity = 1;
    s2v4.muted = false;
    s2v4.play();


  } else if (scene % sceneNum == 4) {
    //ジェンガ崩れる
    loopCount = -100;
    console.log("down because of gaze");
  }
}

// 動画差し替え
function changeMovie() {
  timeStart = new Date();
  muteAllVideos();
  if (scene % sceneNum == 0) {
    //生姜の始まり    
    clearAllVideos();
 
    s1v1.style.opacity = 1;
    s1v2.style.opacity = 0;
    s1v1.muted = false;
    s1v1.play();
    //s1v2.load();
    //s2v1.load();


  } else if (scene % sceneNum == 1) {
    //ろうそく1
    clearAllVideos();

    s2v1.style.opacity = 1;
    //s2v2.style.opacity = 0;
    //s2v3.style.opacity = 0;
    //s2v4.style.opacity = 0;
    s2v1.muted = false;
    s2v1.play();
    
    //s2v2.load();
    //s2v3.load();
    //s2v4.load();

  } else if (scene % sceneNum == 2) {
    //ろうそく2
  
    
    s2v1.style.opacity = 0;
    s2v2.style.opacity = 0;
    s2v3.style.opacity = 1;
    s2v3.muted = false;
    s2v3.play();

    //s3v1.load();

  } else if (scene % sceneNum == 3) {
    //ジェンガ導入
    clearAllVideos();
    //videoElem1.src = "asset/Loop前.mp4";
    //videoElem1.style.opacity = 1;

    s3v1.style.opacity = 1;
    
    //s3v2.load();
    //s3v3.load();
    //s3v4.load();

    sleep(100);

    
    //s3v2.style.opacity = 1;
    //s3v3.style.opacity = 1;
    s3v1.muted = false;
    s3v1.play();


  } else if (scene % sceneNum == 4) {
    //ジェンガループ


    s3v1.style.opacity = 0;
    s3v2.style.opacity = 1;
    s3v2.muted = false;
    s3v2.play();

  } else if (scene % sceneNum == 5) {
    //ジェンガ崩れる

    
    s3v2.style.opacity = 0;
    s3v3.style.opacity = 1;
    s3v3.muted = false;
    s3v3.play();

  } else if (scene % sceneNum == 6) {
    imgElemBlack.style.opacity = 1; //black background
    //タイトル崩れる
    for (let i = 0; i < 9; i++) {
      tvel[i].style.opacity = 1;
      tvel[i].currentTime = 0.0;
      tvel[i].play();
    }
  }
  setTarget();
  /*   console.log(
    (videoElem1.style.opacity,
    videoElem2.style.opacity,
    videoElem3.style.opacity,
    videoElem4.style.opacity)
  ); */
}

// target領域の設定と描画（単位はvw/vh）
function setTarget() {
  // set
  if (scene % sceneNum == 0) {
    xtarget = 0;
    ytarget = 0;
    wtarget = 40;
    htarget = 100;
  } else if (scene % sceneNum == 1) {
    xtarget = 60;
    ytarget = 0;
    wtarget = 30;
    htarget = 100;
  } else if (scene % sceneNum == 2) {
    xtarget = 0;
    ytarget = 0;
    wtarget = 40;
    htarget = 100;
  } else if (scene % sceneNum == 3) {
    xtarget = 0;
    ytarget = 0;
    wtarget = 0;
    htarget = 0;
  } else if (scene % sceneNum == 4) {
    xtarget = 39;
    ytarget = 0;
    wtarget = 27;
    htarget = 100;
  } else if (scene % sceneNum == 5) {
    xtarget = 0;
    ytarget = 0;
    wtarget = 0;
    htarget = 0;
  }

  // draw
  xtarget = ww * (xtarget / 100);
  ytarget = wh * (ytarget / 100);
  wtarget = ww * (wtarget / 100);
  htarget = wh * (htarget / 100);
  targetel.style.left = xtarget + "px";
  targetel.style.top = ytarget + "px";
  targetel.style.width = wtarget + "px";
  targetel.style.height = htarget + "px";
}

// ビデオ全ミュート
function muteAllVideos() {
  s1v1.muted = true;
  s1v2.muted = true;
  s2v1.muted = true;
  s2v2.muted = true;
  s2v3.muted = true;
  s2v4.muted = true;
  s3v1.muted = true;
  s3v2.muted = true;
  s3v3.muted = true;
  s3v4.muted = true;
}

function loadAllVideos()
{
  s1v1.load();
  s1v2.load();
  s2v1.load();
  s2v2.load();
  s2v3.load();
  s2v4.load();
  s3v1.load();
  s3v2.load();
  s3v3.load();
  s3v4.load();

}

// ビデオ全透明
function clearAllVideos() {
  s1v1.style.opacity = 0;
  s1v2.style.opacity = 0;
  s2v1.style.opacity = 0;
  s2v2.style.opacity = 0;
  s2v3.style.opacity = 0;
  s2v4.style.opacity = 0;
  s3v1.style.opacity = 0;
  s3v2.style.opacity = 0;
  s3v3.style.opacity = 0;
  s3v4.style.opacity = 0;

  videoElemEnd.style.opacity = 0;
  for (let i = 0; i < 9; i++) {
    tvel[i].style.opacity = 0;
    tvel[i].currentTime = 0.0;
  }
}

// ビジーwaitを使う方法
function sleep(waitMsec) {
  var startMsec = new Date();

  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}

// 手前のビデオループをなめらかに
s1v1.addEventListener("timeupdate", function () {
  //生姜ループ
  if (scene % sceneNum == 0) {
    if (this.currentTime >= 0.22) {
      this.currentTime = 0.0;
    }
  } 
});

s2v1.addEventListener("timeupdate", function () {
  //ろうそくループ1
  if (scene % sceneNum == 1) {
    if (this.currentTime >= 9.5) {
      this.currentTime = 0.0;
    }
  }
});

s2v3.addEventListener("timeupdate", function () {
  //ろうそくループ2
  if (scene % sceneNum == 2) {
    if (this.currentTime >= 6.8) {
      this.currentTime = 0.0;
    }
  }
});

s3v2.addEventListener("timeupdate", function () {
  if (scene % sceneNum == 4) {
    if (this.currentTime >= 1.55) {
      
      if (loopCount < 0) {
        //視線によりジェンガ崩れる
       

        //videoElem2.style.opacity = 0;
        //videoElem3.muted = false;
        //videoElem3.play();

        console.log("play down video");

        s3v2.style.opacity = 0;
        s3v3.style.opacity = 1;
        s3v3.muted = false;
        s3v3.play();

        scene += 1;
        loopCount = 0;
        
      } else if (0 <= loopCount < 5) {
        this.currentTime = 0.0;
        s3v2.style.opacity = 1;
        loopCount += 1;
        s3v2.play();
        console.log(loopCount + "<=5");
      }
      if(loopCount >= 5) {
        //ジェンガ崩れない
        console.log("not down "+loopCount);

        
        s3v2.muted = true;
        s3v4.muted = false;
        s3v2.style.opacity = 0;
        s3v3.style.opacity = 0;
        s3v4.style.opacity = 1;
        s3v4.play();

        scene += 1;
        loopCount = 0;
      }
    }
  }

});





// ビデオの終了フラグ　シーンを切り替える
videoElemStart.addEventListener("ended", function () {
  webgazer.removeMouseEventListeners();
  timeStart = new Date();
  this.style.opacity = 0;
  nowStatus = "CALIBRATION";

  //s1v1.load(); //ここで生姜をロード
});

s3v1.addEventListener("ended", function () {
  //ジェンガ導入終わり
  if (scene % sceneNum == 3) {
    scene += 1;
    changeMovie();
  }
});
s1v2.addEventListener("ended", function () {
  //生姜終わり
  if (scene % sceneNum == 0) {
    scene += 1;
    changeMovie();
  }
});
s2v2.addEventListener("ended", function () {
  //ろうそく1終わり
  if (scene % sceneNum == 1) {
    scene += 1;
    changeMovie();
  }
});

s3v3.addEventListener("ended", function () {
  //ジェンガ成功終わり
  if (scene % sceneNum == 5) {
    this.style.opacity = 0;
    scene += 1;
    changeMovie();
  }
});

s2v4.addEventListener("ended", function () {
  //ろうそく2終わり
  if (scene % sceneNum == 2) {
    scene += 1;
    changeMovie();
  }
});

s3v4.addEventListener("ended", function () {
  //ジェンガ失敗終わり
  if (scene % sceneNum == 5) {
    this.style.opacity = 0;
    scene += 1;
    changeMovie();
  }
});
videoElemEnd.addEventListener("ended", function () {
  webgazer.removeMouseEventListeners();
  this.style.opacity = 0;
  nowStatus = "START";
  videoElemStart.style.opacity = 1;
});

//文字の映像が途中まで流れる
for (let i = 0; i < 9; i++) {
  tvel[i].addEventListener("timeupdate", function () {
    if (tvpause[i] & (this.currentTime >= 0.93)) {
      this.pause();
      tvpause[i] = false;
    }
  });
}
//START画面文字落下終了フラグ
for (let i = 0; i < 9; i++) {
  tvel[i].addEventListener("ended", function () {
    tvplay[i] = true;
    tvpause[i] = true;
  });
}

// キーボードを押した時の挙動管理
// G : gaze ON/OFF          
// T : target ON/OFF
// F : face ON/OFF 　　　　　　機能していない！！
// 1 : 動画を1つ進める          web無効
// 2 : 動画を1つ戻す                  web無効
// 3 : 手前の動画 ON/OFF             web無効
// 4 : target領域を見る          web無効
// Q : calibrationモードに移行　　　　web無効
// Z : calibration開始                 web無効
// A : 映像モードに移行             web無効
// X : 学習データ初期化         怖いので今は無効にしてる！！
// N : 学習ストップ          web無効
// L : 学習開始            web無効
document.addEventListener("keypress", keypress_ivent);

function keypress_ivent(e) {
  if (e.key === "g" || e.key === "G") {
    gazeel.style.opacity = 0.5 - gazeel.style.opacity;
  } else if (e.key === "t" || e.key === "T") {
    targetel.style.opacity = 0.5 - targetel.style.opacity;
  } else if (e.key === "f" || e.key === "F") {
    //faceel.style.opacity = 0.7 - faceel.style.opacity;
  } else if (e.key === "1") {
    scene += 1;
    changeMovie();
  } else if (e.key === "2") {
    /*
    scene -= 1;
    if (scene < 0) {
      scene += sceneNum;
    }
    changeMovie();
    */
  } else if (e.key === "3") {
    //videoElem1.style.opacity = 1 - videoElem1.style.opacity;
  } else if (e.key === "4") {
    //videoElem1.style.opacity = 0;
    //videoElem2.play();
  } else if (e.key === "q" || e.key === "Q") {
    /*
    nowStatus = "CALIBRATION"; //キャリブレーションモードに移行するが、キャリブレーションを始めるにはzを押す
    timeStart = new Date();
    imgElemWhite.style.opacity = 1;
    muteAllVideos();
    */
  } else if (e.key === "z" || e.key === "Z") {
    /*
    if (calib % 2 == 0) { //zを一回目押すとキャリブレーションON
      noCalibration = false;
      imgElemWhite.src = "asset/WHITE3.png";
      calibration();
    } else {
      noCalibration = true; //zを二回目押すとキャリブレーションOFF
      imgElemWhite.src = "asset/WHITE2.png";
      closeCalibration();
    }
    calib += 1;
  */
  } else if (e.key == "a" || e.key === "A") {
    /*
    imgElemWhite.style.opacity = 0;
    //MOVIEの初期化
    nowStatus = "MOVIE";
    scene = 0;
    changeMovie();
    */
  } else if (e.key == "x" || e.key === "X") {
    //clear();
  } else if (e.key == "n" || e.key == "N") {
    //webgazer.removeMouseEventListeners();
    //console.log("Press N");
  } else if (e.key == "l" || e.key == "L") {
    //webgazer.addMouseEventListeners();
    //console.log("Press L");
  }
  return false;
}

/* 










＃＃＃＃＃＃＃＃＃＃＃＃＃＃
＃　　いじる必要がない　　＃
＃　NEED NOT TO TOUCH ＃
＃＃＃＃＃＃＃＃＃＃＃＃＃＃
*/

//webgazer.showVideo(false);
webgazer.showPredictionPoints(false);
webgazer.applyKalmanFilter(true);
setTimeout(() => {
  webgazer.setVideoViewerSize(200, 200);
}, 1000);

//window.saveDataAcrossSessions = true;
window.onbeforeunload = function () {
  webgazer.end();
};

let calibratePoints = [0, 0, 0, 0, 0, 0, 0, 0, 0];
function calibrate(num) {
  let nidx = num - 1;
  calibratePoints[nidx]++;
  let green = 255 - 255 * (calibratePoints[nidx] / 5);
  document.querySelector(".calibrationpoint.point" + num).style.background =
    "rgb(255, " + green + ", 0)";
  let count = 0;
  calibratePoints.forEach((p, i) => {
    if (p >= 2) {
      count++;
    }
  });
  if (count >= calibratePoints.length) {
    alert("キャリブレーションは完了しました\n 操作方法: \n G: 視線ポインタ オン/オフ \n T: 視線の目標領域 オン/オフ");
    closeCalibration();
  }
}
function calibration() {
  webgazer.addMouseEventListeners(); //キャリブレーション中のみ学習
  document.querySelector("#calibrationbox").style.display = "block";
  calibratePoints.forEach((p, i) => {
    calibratePoints[i] = 0;
  });
  calib = 1;
  loadAllVideos();
}
function closeCalibration() {
  webgazer.removeMouseEventListeners(); //キャリブレーションが終わったら学習を閉じる
  document.querySelector("#calibrationbox").style.display = "none";
  
  //キャリブレーションが終わったらMOVIEに移行 web
  //MOVIEの初期化
  calib = 0;
  nowStatus = "MOVIE";
  noCalibration = false;
  gazeel.style.opacity = 0;
  imgElemWhite.style.opacity = 0;
  scene = 0;
  changeMovie();
 
}
function clear() {
  webgazer.clearData(); // データをクリアする
}
