import { headerIcons } from './../../../../image-pathes/header-icons';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { filter, takeUntil } from 'rxjs/operators';
import { JwtService } from '@global-service/jwt/jwt.service';
import { LocalStorageService } from '@global-service/localstorage/local-storage.service';
import { UserService } from 'src/app/service/user/user.service';
import { AchievementService } from 'src/app/service/achievement/achievement.service';
import { HabitStatisticService } from 'src/app/service/habit-statistic/habit-statistic.service';
import { LanguageService } from '@language-service/language.service';
import { Language } from '@language-service/Language';
import { SearchService } from '@global-service/search/search.service';
import { UserOwnAuthService } from '@auth-service/user-own-auth.service';
import { LanguageModel } from '../models/languageModel';
import { AuthModalComponent } from '@global-auth/auth-modal/auth-modal.component';
import { environment } from '@environment/environment';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly selectLanguageArrow = 'assets/img/arrow_grey.png';
  readonly dropDownArrow = 'assets/img/arrow.png';
  public dropdownVisible = false;
  public langDropdownVisible = false;
  public name: string;
  public isLoggedIn: boolean;
  public isAdmin: boolean;
  public managementLink: string;
  public isAllSearchOpen = false;
  public toggleBurgerMenu = false;
  public arrayLang: Array<LanguageModel> = [
    { lang: 'Ua' },
    { lang: 'En' },
    { lang: 'Ru' }];
  public isSearchClicked = false;
  private adminRoleValue = 'ROLE_ADMIN';
  private userRole: string;
  private userId: number;
  private backEndLink = environment.backendLink;
  private destroySub: Subject<boolean> = new Subject<boolean>();
  public headerImageList = headerIcons;
  public skipPath: string;
  @ViewChild('signinref', {static: false}) signinref: ElementRef;
  @ViewChild('signupref', {static: false}) signupref: ElementRef;
  public elementName;

  constructor(
    public dialog: MatDialog,
    private localStorageService: LocalStorageService,
    private jwtService: JwtService,
    private router: Router,
    private userService: UserService,
    private achievementService: AchievementService,
    private habitStatisticService: HabitStatisticService,
    private languageService: LanguageService,
    private searchSearch: SearchService,
    private userOwnAuthService: UserOwnAuthService) { }

  ngOnInit() {

    this.dialog.afterAllClosed
      .pipe(takeUntil(this.destroySub))
      .subscribe(() => {
        this.focusDone();
      });

    this.searchSearch.searchSubject
      .pipe(
        takeUntil(this.destroySub)
      ).subscribe(signal => this.openSearchSubscription(signal));

    this.searchSearch.allSearchSubject
      .pipe(
        takeUntil(this.destroySub)
      ).subscribe(signal => this.openAllSearchSubscription(signal));

    this.localStorageService.firstNameBehaviourSubject
      .pipe(
        takeUntil(this.destroySub)
      ).subscribe(firstName => { this.name = firstName; });

    this.initUser();
    this.setLangArr();
    this.jwtService.userRole$.pipe(
      takeUntil(this.destroySub)
    ).subscribe(userRole => {
      this.userRole = userRole;
      this.isAdmin = this.userRole === this.adminRoleValue;
    });
    this.autoOffBurgerBtn();
    this.userOwnAuthService.getDataFromLocalStorage();

    this.userOwnAuthService.isLoginUserSubject
      .pipe(
        takeUntil(this.destroySub)
      ).subscribe(
        status => this.isLoggedIn = status
      );

    this.localStorageService.accessTokenBehaviuorSubject
      .pipe(
        takeUntil(this.destroySub)
      ).subscribe(
        (token) => {
          this.managementLink = `${this.backEndLink}token?accessToken=${token}`;
        }
      );
  }

  public focusDone(): void {
    if (this.elementName === 'sign-up') { this.signupref.nativeElement.focus(); }
    if (this.elementName === 'sign-in') { this.signinref.nativeElement.focus(); }
  }

  ngOnDestroy() {
    this.destroySub.next(true);
    this.destroySub.unsubscribe();
  }

  setLangArr(): void {
    const language = this.languageService.getCurrentLanguage();
    const currentLangObj = { lang: language.charAt(0).toUpperCase() + language.slice(1) };
    const currentLangIndex = this.arrayLang.findIndex(lang => lang.lang === currentLangObj.lang);
    this.arrayLang = [
      currentLangObj,
      ...this.arrayLang.slice(0, currentLangIndex),
      ...this.arrayLang.slice(currentLangIndex + 1)
    ];
  }

  private initUser(): void {
    this.localStorageService.userIdBehaviourSubject
      .pipe(
        takeUntil(this.destroySub),
        filter(userId => userId !== null && !isNaN(userId))
      ).subscribe(userId => this.assignData(userId));
  }

  public changeCurrentLanguage(language, index: number): void {
    this.languageService.changeCurrentLanguage(language.toLowerCase() as Language);
    const temporary = this.arrayLang[0].lang;
    this.arrayLang[0].lang = language;
    this.arrayLang[index].lang = temporary;
    this.langDropdownVisible = false;
  }

  public getUserId(): number | string {
    if (this.userId !== null && !isNaN(this.userId)) {
      return this.userId;
    }

    return 'not_signed_in';
  }

  private autoOffBurgerBtn(): void {
    this.router.events
      .pipe(
        takeUntil(this.destroySub),
        filter((events) => events instanceof NavigationStart)
      )
      .subscribe(() => {
        this.toggleBurgerMenu = false;
        this.toggleScroll();
      });
  }

  private assignData(userId: number): void {
    this.userId = userId;
    this.userOwnAuthService.isLoginUserSubject.next(true);
  }

  public toggleSearchPage(): void {
    this.searchSearch.toggleSearchModal();
  }

  private openSearchSubscription(signal: boolean): void {
    this.isSearchClicked = signal;
  }

  private openAllSearchSubscription(signal: boolean): void {
    this.isAllSearchOpen = signal;
  }

  public toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  public autoCloseUserDropDown(event): void {
    this.dropdownVisible = event;
  }

  public autoCloseLangDropDown(event): void {
    this.langDropdownVisible = event;
  }

  public onToggleBurgerMenu(): void {
    this.toggleBurgerMenu = !this.toggleBurgerMenu;
    this.toggleScroll();
  }

  public openAuthModalWindow(page: string): void {
    this.elementName = page;
    this.dialog.open(AuthModalComponent, {
      hasBackdrop: true,
      closeOnNavigation: true,
      panelClass: ['custom-dialog-container'],
      data: {
        popUpName: page
      }
    });
  }

  public openSettingDialog(): void {
    this.dropdownVisible = false;
    this.router.navigate(['/profile', this.userId, 'edit']);
  }

  public signOut(): void {
    this.dropdownVisible = false;
    this.userOwnAuthService.isLoginUserSubject.next(false);
    this.localStorageService.clear();
    this.userService.onLogout();
    this.habitStatisticService.onLogout();
    this.achievementService.onLogout();
    this.router.navigateByUrl('/').then(r => r);
    this.userOwnAuthService.getDataFromLocalStorage();
    this.jwtService.userRole$.next('');
  }

  public toggleScroll(): void {
    this.toggleBurgerMenu ?
      document.body.classList.add('modal-open') :
      document.body.classList.remove('modal-open');
  }
}
