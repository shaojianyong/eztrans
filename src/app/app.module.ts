import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
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
import { TextParserService } from './parsers/text/text-parser.service';
import { AboutComponent } from './about/about.component';
import { SettingsComponent } from './settings/settings.component';
import { MarkdownParserService } from './parsers/markdown/markdown-parser.service';
import { PoParserService } from './parsers/po/po-parser.service';
import { HomeComponent } from './home/home.component';
import { MsgboxComponent } from './msgbox/msgbox.component';
import { StatsComponent } from './stats/stats.component';
import { OpenComponent } from './open/open.component';


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
    RouterModule.forRoot(routes)
  ],
  providers: [
    GoogleTranslateService,
    BaiduFanyiService,
    BaiduVipfyService,
    IcibaTransService,
    HtmlParserService,
    MarkdownParserService,
    PoParserService,
    TextParserService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
