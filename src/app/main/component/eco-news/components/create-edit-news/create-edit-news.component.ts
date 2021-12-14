import { Component, OnInit, OnDestroy, Inject, Injector } from '@angular/core';
import { FormArray, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil, catchError, take, delay } from 'rxjs/operators';
import { QueryParams, TextAreasHeight } from '../../models/create-news-interface';
import { EcoNewsService } from '../../services/eco-news.service';
import { Subscription, ReplaySubject, throwError } from 'rxjs';
import { CreateEcoNewsService } from '@eco-news-service/create-eco-news.service';
import { CreateEditNewsFormBuilder } from './create-edit-news-form-builder';
import { FilterModel } from '@eco-news-models/create-news-interface';
import { EcoNewsModel, NewsTagInterface } from '@eco-news-models/eco-news-model';
import { ACTION_TOKEN, TEXT_AREAS_HEIGHT } from './action.constants';
import { ActionInterface } from '../../models/action.interface';
import { MatSnackBarComponent } from '@global-errors/mat-snack-bar/mat-snack-bar.component';
import { FormBaseComponent } from '@shared/components/form-base/form-base.component';
import { LocalStorageService } from '@global-service/localstorage/local-storage.service';
import { EditorChangeContent, EditorChangeSelection } from 'ngx-quill';
import Quill from 'quill';
import 'quill-emoji/dist/quill-emoji.js';
import ImageResize from 'quill-image-resize-module';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { checkImages, transformBase64ToFile } from './quillEditorFunc';

@Component({
  selector: 'app-create-edit-news',
  templateUrl: './create-edit-news.component.html',
  styleUrls: ['./create-edit-news.component.scss']
})
export class CreateEditNewsComponent extends FormBaseComponent implements OnInit, OnDestroy {
  constructor(
    private http: HttpClient,
    public router: Router,
    public dialog: MatDialog,
    private injector: Injector,
    @Inject(ACTION_TOKEN) private config: { [name: string]: ActionInterface }
  ) {
    super(router, dialog);
    this.createEditNewsFormBuilder = injector.get(CreateEditNewsFormBuilder);
    this.createEcoNewsService = injector.get(CreateEcoNewsService);
    this.ecoNewsService = injector.get(EcoNewsService);
    this.route = injector.get(ActivatedRoute);
    this.localStorageService = injector.get(LocalStorageService);
    this.snackBar = injector.get(MatSnackBarComponent);
    this.quillModules = {
      'emoji-shortname': true,
      'emoji-textarea': false,
      'emoji-toolbar': true,
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
          ['blockquote', 'code-block'],

          [{ header: 1 }, { header: 2 }], // custom button values
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
          [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
          [{ direction: 'rtl' }], // text direction

          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],
          ['clean'], // remove formatting button
          ['link', 'image', 'video'], // link and image, video
          ['emoji']
        ]
        // handlers: {
        //   image: (image) => {
        //     console.log(image);
        //   }
        // },
      },
      imageResize: true
    };
    Quill.register('modules/imageResize', ImageResize);
  }

  public isPosting = false;
  public form: FormGroup;
  public isArrayEmpty = true;
  public textAreasHeight: TextAreasHeight;
  public isLinkOrEmpty = true;
  public newsItemSubscription: Subscription;
  public isFilterValidation = false;
  public date = {
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  };
  public author: string = localStorage.getItem('name');
  public attributes: ActionInterface;
  public filters: FilterModel[] = [];
  public newsId: string;
  public formData: FormGroup;
  private destroyed$: ReplaySubject<any> = new ReplaySubject<any>(1);
  public isFormInvalid: boolean;
  public formChangeSub: Subscription;
  public previousPath = '/news';
  public popupConfig = {
    hasBackdrop: true,
    closeOnNavigation: true,
    disableClose: true,
    panelClass: 'popup-dialog-container',
    data: {
      popupTitle: 'homepage.eco-news.news-popup.title',
      popupSubtitle: 'homepage.eco-news.news-popup.subtitle',
      popupConfirm: 'homepage.eco-news.news-popup.confirm',
      popupCancel: 'homepage.eco-news.news-popup.cancel'
    }
  };
  public onSubmit;
  private createEditNewsFormBuilder: CreateEditNewsFormBuilder;
  private createEcoNewsService: CreateEcoNewsService;
  private ecoNewsService: EcoNewsService;
  private route: ActivatedRoute;
  private localStorageService: LocalStorageService;
  private snackBar: MatSnackBarComponent;
  public quillModules = {};
  public blurred = false;
  public focused = false;
  public editorText = '';
  public editorHTML = '';
  public savingImages = false;

  ngOnInit() {
    this.getNewsIdFromQueryParams();
    this.initPageForCreateOrEdit();
    this.onSourceChange();
    this.setLocalizedTags();
  }

  private filterArr(item: FilterModel, index: number) {
    return [...this.filters.slice(0, index), item, ...this.filters.slice(index + 1)];
  }

  public setInitialValues(): void {
    if (!this.createEcoNewsService.isBackToEditing) {
      this.initialValues = this.getFormValues();
    }
    this.isFormInvalid = !!!this.newsId;
    this.onValueChanges();
  }

  public allowUserEscape(): void {
    this.areChangesSaved = true;
  }

  public getFormValues(): any {
    return this.form.value;
  }

  public onValueChanges(): void {
    console.log(this.form);
    this.formChangeSub = this.form.valueChanges.subscribe(() => {
      this.isFormInvalid = !this.form.valid || this.isArrayEmpty || !this.isLinkOrEmpty || this.isImageValid();
    });
  }

  private setLocalizedTags() {
    this.localStorageService.languageBehaviourSubject.pipe(takeUntil(this.destroyed$)).subscribe(() => this.getAllTags());
  }

  private getAllTags() {
    const tags = this.localStorageService.getTagsOfNews('newsTags');
    if (tags) {
      this.filters = tags;
      return;
    }

    this.ecoNewsService
      .getAllPresentTags()
      .pipe(take(1))
      .subscribe((tagsArray: Array<NewsTagInterface>) => {
        this.filters = tagsArray.map((tag) => {
          return {
            name: tag.name,
            isActive: false
          };
        });
      });
  }

  public initPageForCreateOrEdit(): void {
    this.textAreasHeight = TEXT_AREAS_HEIGHT;

    if (this.createEcoNewsService.isBackToEditing) {
      if (this.createEcoNewsService.getNewsId()) {
        this.setDataForEdit();
      } else {
        this.setDataForCreate();
      }
      this.formData = this.createEcoNewsService.getFormData();
      this.newsId = this.createEcoNewsService.getNewsId();
      if (this.formData) {
        console.log('1', this.formData);
        this.form = this.createEditNewsFormBuilder.getEditForm(this.formData.value);
        this.setActiveFilters(this.formData.value);
      }
      this.setInitialValues();
    } else {
      if (this.newsId) {
        this.fetchNewsItemToEdit();
        this.setDataForEdit();
      } else {
        console.log('2', this.formData);
        this.form = this.createEditNewsFormBuilder.getSetupForm();
        this.setDataForCreate();
        this.setInitialValues();
      }
    }
  }

  public setDataForEdit(): void {
    this.attributes = this.config.edit;
    this.onSubmit = this.editNews;
  }

  public setDataForCreate(): void {
    this.attributes = this.config.create;
    this.onSubmit = this.createNews;
  }

  public getNewsIdFromQueryParams(): void {
    this.route.queryParams.subscribe((queryParams: QueryParams) => {
      this.newsId = queryParams.id;
    });
  }

  public autoResize(textarea: boolean, e: any) {
    const DEFAULT_SIZE_INPUT_TITTLE = '48px';
    const DEFAULT_SIZE_INPUT_CONTENT = '131px';
    e.target.style.height = textarea ? DEFAULT_SIZE_INPUT_CONTENT : DEFAULT_SIZE_INPUT_TITTLE;
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  public onSourceChange(): void {
    if (this.form) {
      this.form.get('source').valueChanges.subscribe((source: string) => {
        this.isLinkOrEmpty = /^$|^https?:\/\//.test(source);
      });
    }
  }

  public sendData(): void {
    this.form.value.content = this.editorHTML;
    this.createEcoNewsService
      .sendFormData(this.form)
      .pipe(
        delay(5000),
        takeUntil(this.destroyed$),
        catchError((err) => {
          this.snackBar.openSnackBar('Oops, something went wrong. Please reload page or try again later.');
          return throwError(err);
        })
      )
      .subscribe(() => this.escapeFromCreatePage());

    this.localStorageService.removeTagsOfNews('newsTags');
  }

  public createNews(): void {
    const imagesSrc = checkImages(this.editorHTML);
    if (imagesSrc === 'NO_IMAGES') {
      this.sendData();
    } else {
      const imgFiles = imagesSrc.map((base64) => transformBase64ToFile(base64));
      console.log(imgFiles);
      // const formData: FormData = new FormData();
      this.createEcoNewsService.sendImagesData(imgFiles).subscribe(
        (response) => {
          // response.forEach((link) => {
          //   this.editorHTML = this.editorHTML.replace(findBase64Regex, link);
          // });
          console.log('html', response);
          // this.savingImages = false;
        },
        () => {
          this.savingImages = false;
        }
      );
    }

    // this.isPosting = true;
    // this.savingImages = true;
    console.log('createNews');

    // this.saveImages();

    // const waitForElement = () => {
    //   if (this.savingImages === false) {
    //     console.log('service', this.savingImages);
    //     console.log('form', this.form);
    //     this.form.value.content = this.editorHTML;
    //     this.createEcoNewsService
    //       .sendFormData(this.form)
    //       .pipe(
    //         delay(5000),
    //         takeUntil(this.destroyed$),
    //         catchError((err) => {
    //           this.snackBar.openSnackBar('Oops, something went wrong. Please reload page or try again later.');
    //           return throwError(err);
    //         })
    //       )
    //       .subscribe(() => this.escapeFromCreatePage());
    //
    //     this.localStorageService.removeTagsOfNews('newsTags');
    //   } else {
    //     console.log('wait', this.savingImages);
    //     setTimeout(waitForElement, 250);
    //   }
    // };
    // waitForElement();
  }

  public escapeFromCreatePage() {
    this.isPosting = false;
    this.allowUserEscape();
    this.router.navigate(['/news']);
  }

  public editNews(): void {
    const dataToEdit = {
      ...this.form.value,
      id: this.newsId
    };

    this.createEcoNewsService
      .editNews(dataToEdit)
      .pipe(
        catchError((error) => {
          this.snackBar.openSnackBar('Something went wrong. Please reload page or try again later.');
          return throwError(error);
        })
      )
      .subscribe(() => this.escapeFromCreatePage());
  }

  public fetchNewsItemToEdit(): void {
    this.newsItemSubscription = this.ecoNewsService
      .getEcoNewsById(this.newsId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((item: EcoNewsModel) => {
        this.form = this.createEditNewsFormBuilder.getEditForm(item);
        this.setActiveFilters(item);
        this.onSourceChange();
        this.setInitialValues();
      });
  }

  public setActiveFilters(itemToUpdate: EcoNewsModel): void {
    if (itemToUpdate.tags.length) {
      this.isArrayEmpty = false;
      itemToUpdate.tags.forEach((tag: NewsTagInterface) => {
        const index = this.filters.findIndex((filterObj: FilterModel) => filterObj.name === `${tag}`);
        this.filters = this.filterArr({ name: `${tag}`, isActive: true }, index);
      });
    }
  }

  tags(): FormArray {
    return this.form.controls.tags as FormArray;
  }

  public addFilters(filterObj: FilterModel): void {
    if (!filterObj.isActive) {
      this.toggleIsActive(filterObj, true);
      this.isArrayEmpty = false;
      this.tags().push(new FormControl(filterObj.name));
      this.filtersValidation(filterObj);
    } else {
      this.removeFilters(filterObj);
    }
  }

  public removeFilters(filterObj: FilterModel): void {
    const tagsArray = this.form.value.tags;
    if (filterObj.isActive && tagsArray.length === 1) {
      this.isArrayEmpty = true;
    }
    const index = tagsArray.findIndex((tag) => tag === filterObj.name);
    this.tags().removeAt(index);
    this.toggleIsActive(filterObj, false);
  }

  public filtersValidation(filterObj: FilterModel): void {
    if (this.form.value.tags.length > 3) {
      this.isFilterValidation = true;
      setTimeout(() => (this.isFilterValidation = false), 3000);
      this.tags().removeAt(3);
      this.toggleIsActive(filterObj, false);
    }
  }

  public toggleIsActive(filterObj: FilterModel, newValue: boolean): void {
    const index = this.filters.findIndex((item: FilterModel) => item.name === filterObj.name);
    const changedTags = this.filterArr({ name: filterObj.name, isActive: newValue }, index);
    this.filters = changedTags;
    this.localStorageService.setTagsOfNews('newsTags', changedTags);
  }

  public goToPreview(): void {
    this.allowUserEscape();
    this.createEcoNewsService.setForm(this.form);
    this.createEcoNewsService.setNewsId(this.newsId);
    this.router.navigate(['news', 'preview']);
  }

  public isImageValid(): boolean {
    return this.createEcoNewsService.isImageValid;
  }

  changedEditor(event: EditorChangeContent | EditorChangeSelection) {
    const getImagesSrc = (html) => {
      const img = html.match(/<img [^>]*src="[^"]*"[^>]*>/gm);
      const img2 = html.match(/<img [^>]*src="(data:image\/[^;]+;base64[^"]+)"/gm);
      // console.log(img2);
    };

    if (event.event !== 'selection-change') {
      this.editorText = event.text;
      this.editorHTML = event.html;
    }
  }

  saveImages() {
    // if (!this.editorHTML) {
    //   this.savingImages = false;
    //   return console.warn('No Data in Text Editor');
    // }

    const findBase64Regex = /data:image\/([a-zA-Z]*);base64,([^"]*)/g;
    const imagesSrc = this.editorHTML.match(findBase64Regex);

    if (!imagesSrc) {
      this.savingImages = false;
      return console.warn('No Images in Text Editor');
    }

    const imgFiles = imagesSrc.map((base64) => transformBase64ToFile(base64));
    const formData: FormData = new FormData();
    console.log(imgFiles);

    Promise.all(imgFiles)
      .then((results: [File]) => {
        console.log('res', results);

        results.forEach((res: File) => {
          formData.append('images', res);
        });

        console.log('=========');
        const accessToken: string = localStorage.getItem('accessToken');
        const httpOptions = {
          headers: new HttpHeaders({
            Authorization: 'my-auth-token'
          })
        };
        httpOptions.headers.set('Authorization', `Bearer ${accessToken}`);
        httpOptions.headers.append('Content-Type', 'multipart/form-data');
        return this.http.post<any>('https://greencity.azurewebsites.net/econews/uploadImages', formData, httpOptions).subscribe(
          (response) => {
            response.forEach((link) => {
              this.editorHTML = this.editorHTML.replace(findBase64Regex, link);
            });
            console.log('html', this.editorHTML);
            this.savingImages = false;
          },
          () => {
            this.savingImages = false;
          }
        );
      })
      .catch((err) => {
        this.savingImages = false;
        console.error(err);
      });

    // console.log('Go');
  }

  focus($event: any) {
    this.focused = true;
    this.blurred = false;
  }

  blur($event: any) {
    // console.log('blur', $event);
    this.focused = false;
    this.blurred = true;
  }

  // !Quill keyboard Binding
  // addBindingCreated(quill) {
  //   quill.keyboard.addBinding({
  //     key: 'b'
  //   }, (range, context) => {
  //     console.log('KEYBINDING B', range, context);
  //   });
  //
  //   quill.keyboard.addBinding({
  //     key: 'B',
  //     shiftKey: true
  //   }, (range, context) => {
  //     console.log('KEYBINDING SHIFT + B', range, context);
  //   });
  // }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
    if (this.formChangeSub) {
      this.formChangeSub.unsubscribe();
    }
  }
}
