import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { PanelComponent } from './panel/panel.component';


import { GoogleTranslateService } from './providers/google/google-translate.service';
import { BaiduFanyiService } from './providers/baidu/baidu-fanyi.service';
import { BaiduVipfyService } from './providers/baidu/baidu-vipfy.service';
import { IcibaTransService } from './providers/iciba/iciba-trans.service';
import { HtmlParserService } from './parsers/html/html-parser.service';
import { XhtmlParserService } from './parsers/xhtml/xhtml-parser.service';
import { TextParserService } from './parsers/text/text-parser.service';
import { AboutComponent } from './about/about.component';
import { SettingsComponent } from './settings/settings.component';
import { MarkdownParserService } from './parsers/markdown/markdown-parser.service';
import { HomeComponent } from './home/home.component';
import { MsgboxComponent } from './msgbox/msgbox.component';
import { StatsComponent } from './stats/stats.component';
import { OpenComponent } from './open/open.component';
import { AngularSplitModule } from 'angular-split';


const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, pathMatch: 'full' },
  { path: 'main', component: MainComponent, pathMatch: 'full' }
];


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    PanelComponent,
    AboutComponent,
    SettingsComponent,
    HomeComponent,
    MsgboxComponent,
    StatsComponent,
    OpenComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AngularSplitModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    GoogleTranslateService,
    BaiduFanyiService,
    BaiduVipfyService,
    IcibaTransService,
    HtmlParserService,
    XhtmlParserService,
    MarkdownParserService,
    TextParserService
  ],
  bootstrap: [AppComponent],

  // 为了使用浏览器原生标签webview，否则webview会被当作angular组件，从而产生错误
  // stackoverflow.com/questions/47566743/to-allow-any-element-add-no-errors-schema-to-the-ngmodule-schemas-of-this-c
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule { }
