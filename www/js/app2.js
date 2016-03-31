myApp.controller("LoginController", function($scope, $http) {

    // 画面初期化
    $scope.loginInit = function() {
        var domain = localStorage.getItem("Domain");
        if (domain && domain !== "undefined") {
            $scope.domain = domain;
        }
        var appId = localStorage.getItem("AppId");
        if (appId && appId !== "undefined") {
            $scope.appId = appId;
        }
        var loginName = localStorage.getItem("LoginName");
        if (loginName && loginName !== "undefined") {
            $scope.loginName = loginName;
        }
        var loginPass = localStorage.getItem("Password");
        if (loginPass && loginPass !== "undefined") {
            $scope.loginPass = loginPass;
        }
        var basicloginName = localStorage.getItem("BasicLoginName");
        if (basicloginName && basicloginName !== "undefined") {
            $scope.basicloginName = basicloginName;
        }
        var basicloginPass = localStorage.getItem("BasicPassword");
        if (basicloginPass && basicloginPass !== "undefined") {
            $scope.basicloginPass = basicloginPass;
        }
    };

    // テスト接続処理
    $scope.testConnect = function() {
        localStorage.setItem("Domain", $scope.domain);
        localStorage.setItem("AppId", $scope.appId);
        localStorage.setItem("LoginName", $scope.loginName);
        localStorage.setItem("Password", $scope.loginPass);
        localStorage.setItem("BasicLoginName", $scope.basicloginName);
        localStorage.setItem("BasicPassword", $scope.basicloginPass);

        var domain = localStorage.getItem("Domain");
        var appId = localStorage.getItem("AppId");
        var headerparams = (function(){
            var authorization = base64encode($scope.loginName + ":" + $scope.loginPass);

            if($scope.basicloginName && $scope.basicloginPass) {
                var basicAuthorization = "Basic " + base64encode($scope.basicloginName + ":" + $scope.basicloginPass);
                return {
                    "Authorization": basicAuthorization,
                    "X-Cybozu-Authorization": authorization,
                    "Content-Type": "application/json"
                }
            }
            return {
                "X-Cybozu-Authorization": authorization,
                "Content-Type": "application/json"
            }
        })($scope);

        $scope.url = "https://" + $scope.domain + ".cybozu.com/k/v1/records.json";
        $scope.req = {
        　url: $scope.url,
          method: "GET",
          headers: headerparams,
          params: {
            "app": $scope.appId,
          }
        };

        $http($scope.req)
        .success(function success(data) {
                if (data.records) {
                    swal("Success", "テスト接続に成功しました", "success");
                } else {
                    swal("Error", "テスト接続に失敗しました", "error");
                }
        })
        .error(function error(data) {
            swal("Error", "テスト接続に失敗しました", "error");
        });
    };

    // 接続情報の保存
    $scope.saveSetting = function () {
        try{
            if($scope.domain && $scope.appId && $scope.loginName && $scope.loginPass) {
                localStorage.setItem("Domain", $scope.domain);
                localStorage.setItem("AppId", $scope.appId);
                localStorage.setItem("LoginName", $scope.loginName);
                localStorage.setItem("Password", $scope.loginPass);
                localStorage.setItem("BasicLoginName", $scope.basicloginName);
                localStorage.setItem("BasicPassword", $scope.basicloginPass);
                swal('', '保存しました', 'success');
            } else {
                swal("Error", "設定値に誤りがあります", "error");
            }
            
        } catch(e) {
            swal("Error", "設定情報の保存に失敗しました", "error");
        }
    };

    // ログイン情報削除処理
    $scope.deleteInfo = function ($scope) {
        swal({
            title: "",
            text: "設定情報を削除しますか？",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55"
        }, function(isConfirm){
            if (isConfirm) {
                localStorage.clear();
                location.reload();
            }
        });
    };
});

myApp.controller("ReaderController", function($scope, $http) {

    // Setting画面へ
    $scope.viewSettings = function () {
        myNavigator.pushPage("setting.html", {animation: "slide"});
    };

    // バーコード読み取り処理
    $scope.readCode = function(){
        if(!checkSettings()) return;
        console.log("read");
        window.plugins.barcodeScanner.scan(
            this.inputItemCount,
        function(error) {
            console.log("read error");
            swal("Error", "QRの読み取りに失敗しました", "error");
        });
    };

    // 接続情報チェック
    var checkSettings = function(){
        var domain = localStorage.getItem("Domain");
        var appid = localStorage.getItem("AppId");
        var loginName = localStorage.getItem("LoginName");
        var loginPass = localStorage.getItem("Password");
        if(domain && appid && loginName && loginPass) {
            return true;
        }
        swal({
            title: "",
            text: "kintone接続情報が登録されていません\n接続情報を登録しますか?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55"
        }, function(){
            myNavigator.pushPage("setting.html", {animation: "slide"});
        });
        return false;
    };

    // アイテム数入力
    $scope.inputItemCount = function(result) {
        console.log("aaa" + result.text);
        if (result.cancelled){
            console.log("result.cancelled");
            return;
        }

        var readValue = result.text.split(":"); // アイテム名:アイテムコード
        $scope.iname = readValue[0];
        $scope.icode = readValue[1];
        
        if($scope.iname && $scope.icode) {
            ons.notification.prompt({
                messageHTML: "<b>個数を入力して登録してください</b></br></br>" +
                    "アイテム名:" + $scope.iname + "</br>" +
                    "アイテムコード:" + $scope.icode,
                callback: function(icount) {
                    if (icount !== "") {
                        sendRequest(icount);
                    } else {
                        swal("Error", "個数を入力してください", "error");
                    }
                }
            });
        } else {
            swal("Error", "QRコードが正しくありません\nアイテム名:" + $scope.iname + "\n" + "アイテムコード:" + $scope.icode, "error");
        }
    };

    // kintone REST API 実行
    var sendRequest = function(icount) {

        var domain = localStorage.getItem("Domain");
        var appId = localStorage.getItem("AppId");

        var headerparams = (function(){
            var loginName = localStorage.getItem("LoginName");
            var loginPass = localStorage.getItem("Password");
            var basicloginName = localStorage.getItem("BasicLoginName");
            var basicloginPass = localStorage.getItem("BasicPassword");
            var authorization = base64encode(loginName + ":" + loginPass);

            if(basicloginName && basicloginPass) {
                var basicAuthorization = "Basic " + base64encode(basicloginName + ":" + basicloginPass);
                return {
                    "Authorization": basicAuthorization,
                    "X-Cybozu-Authorization": authorization,
                    "Content-Type": "application/json"
                }
            }
            return {
                "X-Cybozu-Authorization": authorization,
                "Content-Type": "application/json"
            }
        })(localStorage);

        var request = {
            url: "https://" + domain + ".cybozu.com/k/v1/record.json",
            method: "POST",
            headers: headerparams,
            data: {
                "app": appId,
                "record": {
                    "itemname": {
                        "value": $scope.iname
                    },
                    "itemcode": {
                        "value": $scope.icode
                    },
                    "itemcount": {
                        "value": icount
                    },
                    "address": {
                        "value": $scope.address
                    },
                    "lat": {
                        "value": $scope.lat
                    },
                    "lng": {
                        "value": $scope.lng
                    }
                }
            }
        };

        $http(request)
        .success(function success(data) {
            if(data.id) {
                swal("Success", "レコードを登録しました", "success");
            } else {
                swal("Error", "レコードの登録に失敗しました", "error");
            }
        })
        .error(function error(data) {
            swal("Error", JSON.stringify(data), "error");
        });
    };

    // reader画面初期化
    $scope.readerInit = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.onSuccess, this.onError, {timeout: 60000});
        } else {
            swal("Error", "navigator.geolocation not supported", "error");
        }
    };

    // 位置情報取得成功
    $scope.onSuccess = function(position) {
        $scope.lat = Number(position.coords.latitude);
        $scope.lng = Number(position.coords.longitude);
        MapClass.initialize();
        MapClass.waitLoaded(1000, 100);
    };

    // 位置情報取得失敗
    $scope.onError = function(error) {
        swal("Error", "現在地の取得に失敗しました", "error");
    };

    // google Maps
    var MapClass = {
        map: undefined,
        geocoder: undefined,
        overlays: [],

        // 地図初期化設定
        initialize: function() {
            this.geocoder = new google.maps.Geocoder();
            var myLatlng = new google.maps.LatLng($scope.lat, $scope.lng);
            var myOptions = {
                zoom: 2,
                center: myLatlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            this.map = new google.maps.Map($("#map")[0], myOptions);
        },

        // googleMapロード
        waitLoaded: function(timeout, interval) {
            setTimeout(function () {
                timeout -= interval;
                if ((typeof google !== "undefined") &&
                    (typeof google.maps !== "undefined") &&
                    (typeof google.maps.version !== "undefined")) {
                        MapClass.viewMap();
                } else if (timeout > 0) {
                    this.waitLoaded();
                } else {
                    // abort
                }
            }, interval);
        },

        // 地図表示
        viewMap: function() {
            var latlng = new google.maps.LatLng($scope.lat, $scope.lng);
            this.geocoder.geocode({"latLng": latlng, "language": "ja"}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {

                    // 住所取得
                     var addr = results[0].formatted_address.split(', ')[1].split(' ');
                     $scope.address = "";
                     for (var i = 1; addr.length > i; i++) {
                        $scope.address += addr[i];
                     }

                    var point = results[0].geometry.location;

                    // 地図のオプションを設定
                    var opts = {
                        zoom: 15,
                        center: point,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        scaleControl: true
                    };

                    var map_address = new google.maps.Map($("#map")[0], opts);

                    // マーカー設定
                    var marker = new google.maps.Marker({
                        position: point,
                        map: map_address,
                        title: $scope.address
                    });
                } else {
                    swal("Error", "マップの読み込みに失敗しました", "error");
                }
            });
            return false;
        }
    };
});
