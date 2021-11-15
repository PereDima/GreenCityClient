(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{"7Gk6":function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));const o={arrowLeft:"assets/img/icon/econews/arrow_left.svg",ellipse:"assets/img/icon/econews/ellipse.svg",largeImage:"assets/img/icon/econews/news-default-large.png",twitter:"assets/img/icon/econews/twitter.svg",facebook:"assets/img/icon/econews/facebook.svg",linkedIn:"assets/img/icon/econews/linkedin.svg"}},"7itd":function(e,t,n){!function(e,t,n){"use strict";var o=function(e){e&&Object.assign(this,e)},s=function(){function t(e,t){this.el=e,this.ngZone=t,this.onAddressChange=new n.EventEmitter}return t.prototype.ngAfterViewInit=function(){this.options||(this.options=new o),this.initialize()},t.prototype.isGoogleLibExists=function(){return!(!google||!google.maps||!google.maps.places)},t.prototype.initialize=function(){var e=this;if(!this.isGoogleLibExists())throw new Error("Google maps library can not be found");if(this.autocomplete=new google.maps.places.Autocomplete(this.el.nativeElement,this.options),!this.autocomplete)throw new Error("Autocomplete is not initialized");null!=!this.autocomplete.addListener&&(this.eventListener=this.autocomplete.addListener("place_changed",(function(){e.handleChangeEvent()}))),this.el.nativeElement.addEventListener("keydown",(function(t){t.key&&"enter"==t.key.toLowerCase()&&t.target===e.el.nativeElement&&(t.preventDefault(),t.stopPropagation())})),window&&window.navigator&&window.navigator.userAgent&&navigator.userAgent.match(/(iPad|iPhone|iPod)/g)&&setTimeout((function(){var e=document.getElementsByClassName("pac-container");if(e){var t=Array.from(e);if(t)for(var n=0,o=t;n<o.length;n++){var s=o[n];s&&s.addEventListener("touchend",(function(e){e.stopImmediatePropagation()}))}}}),500)},t.prototype.reset=function(){this.autocomplete.setComponentRestrictions(this.options.componentRestrictions),this.autocomplete.setTypes(this.options.types)},t.prototype.handleChangeEvent=function(){var e=this;this.ngZone.run((function(){e.place=e.autocomplete.getPlace(),e.place&&e.onAddressChange.emit(e.place)}))},t.ctorParameters=function(){return[{type:n.ElementRef},{type:n.NgZone}]},t.propDecorators={options:[{type:n.Input,args:["options"]}],onAddressChange:[{type:n.Output}]},t.\u0275fac=function(n){return new(n||t)(e.\u0275\u0275directiveInject(e.ElementRef),e.\u0275\u0275directiveInject(e.NgZone))},t.\u0275dir=e.\u0275\u0275defineDirective({type:t,selectors:[["","ngx-google-places-autocomplete",""]],inputs:{options:"options"},outputs:{onAddressChange:"onAddressChange"},exportAs:["ngx-places"]}),t}(),i=function(){function t(){}return t.ctorParameters=function(){return[]},t.\u0275mod=e.\u0275\u0275defineNgModule({type:t}),t.\u0275inj=e.\u0275\u0275defineInjector({factory:function(e){return new(e||t)}}),("undefined"==typeof ngJitMode||ngJitMode)&&e.\u0275\u0275setNgModuleScope(t,{declarations:[s],exports:[s]}),t}();t.GooglePlaceModule=i,t.GooglePlaceDirective=s,Object.defineProperty(t,"__esModule",{value:!0})}(n("fXoL"),t,n("fXoL"))},"aW+4":function(e,t,n){"use strict";n.d(t,"a",(function(){return i}));var o=n("mrSG"),s=n("fXoL");let i=class{setWordDeclension(e){return"1"===e.slice(-1)&&"11"!==e.slice(-2)?"a":"234".includes(e.slice(-1))&&!["12","13","14"].includes(e.slice(-2))?"b":""}};i=Object(o.__decorate)([Object(s.Injectable)({providedIn:"root"})],i)},cP9i:function(e,t,n){"use strict";n.d(t,"a",(function(){return u}));var o=n("mrSG"),s=n("fXoL"),i=n("tk/3"),a=n("jtHE"),r=n("HDdC"),c=n("1G5W"),l=n("IzEk"),g=n("AytR"),p=n("82Ky");let u=class{constructor(e,t){this.http=e,this.localStorageService=t,this.backEnd=g.a.backendLink,this.destroyed$=new a.a(1),this.localStorageService.languageBehaviourSubject.pipe(Object(c.a)(this.destroyed$)).subscribe(e=>this.language=e)}getAllPresentTags(){return this.http.get(`${this.backEnd}econews/tags/all?lang=${this.language}`)}getEcoNewsListByPage(e,t){return this.http.get(`${this.backEnd}econews?page=${e}&size=${t}`)}getNewsListByTags(e,t,n){return this.http.get(`${this.backEnd}econews/tags?page=${e}&size=${t}&tags=${n}`)}getNewsList(){return(new i.d).set("Content-type","application/json"),new r.a(e=>{this.http.get(this.backEnd+"econews").pipe(Object(l.a)(1)).subscribe(t=>{e.next(t)})})}getEcoNewsById(e){return this.http.get(`${this.backEnd}econews/${e}?lang=${this.language}`)}getRecommendedNews(e){return this.http.get(`${this.backEnd}econews/recommended?openedEcoNewsId=${e}`)}getIsLikedByUser(e){return this.http.get(this.backEnd+"econews/isLikedByUser",{params:{econewsId:e}})}postToggleLike(e){return this.http.post(`${this.backEnd}econews/like?id=${e}`,{})}ngOnDestroy(){this.destroyed$.next(!0),this.destroyed$.complete()}};u.ctorParameters=()=>[{type:i.b},{type:p.a}],u=Object(o.__decorate)([Object(s.Injectable)({providedIn:"root"})],u)},q5jP:function(e,t,n){"use strict";n.d(t,"a",(function(){return p}));var o=n("mrSG"),s=n("fXoL"),i=n("tyNb"),a=n("LRne"),r=n("82Ky"),c=n("pLZG"),l=n("fOhs"),g=n("0IaG");let p=class{constructor(e,t,n){this.localStorageService=e,this.router=t,this.dialog=n,this.isLoggedIn=!1,this.localStorageService.userIdBehaviourSubject.subscribe(e=>this.isLoggedIn=null!==e&&!isNaN(e)),this.localStorageService.ubsRegBehaviourSubject.subscribe(e=>this.ubsRegValue=e)}canActivate(e,t){return this.isLoggedIn?Object(a.a)(!0):(this.openSingInWindow("sign-in"),Object(a.a)(!1))}openSingInWindow(e){this.dialog.open(l.a,{hasBackdrop:!0,closeOnNavigation:!0,panelClass:"custom-dialog-container",data:{popUpName:e}}).afterClosed().pipe(Object(c.a)(Boolean)).subscribe(e=>{this.ubsRegValue?this.router.navigateByUrl("/ubs/order"):this.router.navigateByUrl(e+"/profile")})}};p.ctorParameters=()=>[{type:r.a},{type:i.g},{type:g.c}],p=Object(o.__decorate)([Object(s.Injectable)({providedIn:"root"})],p)}}]);