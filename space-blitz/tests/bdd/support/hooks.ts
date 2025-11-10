import { Before, After, BeforeAll, AfterAll, setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';

class CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  devServer?: ChildProcess;

  constructor() {
    this.browser = {} as Browser;
    this.context = {} as BrowserContext;
    this.page = {} as Page;
  }
}

setWorldConstructor(CustomWorld);

BeforeAll(async function () {
  // Start the development server
  console.log('Starting development server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Store reference to dev server
  (global as any).devServer = devServer;

  // Wait for server to be ready
  await new Promise((resolve) => {
    setTimeout(resolve, 3000); // Wait 3 seconds for server to start
  });
});

AfterAll(async function () {
  // Stop the development server
  const devServer = (global as any).devServer as ChildProcess;
  if (devServer) {
    console.log('Stopping development server...');
    devServer.kill();
  }
});

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch();
  this.context = await this.browser.newContext({
    baseURL: 'http://localhost:3000'
  });
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld) {
  await this.page.close();
  await this.context.close();
  await this.browser.close();
});