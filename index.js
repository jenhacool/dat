const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setRequestInterception(true);
  
  page.on('request', (req) => {
    if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
      req.abort();
    }
    else {
      req.continue();
    }
  });

  let cur = 1;

  const results = [];

  while(cur <= 5) {
    console.log(cur);
    await page.goto(`https://dmec.moh.gov.vn/van-ban-cong-bo?p_p_id=vanbancongbo_WAR_trangthietbiyteportlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_vanbancongbo_WAR_trangthietbiyteportlet_keyword=&_vanbancongbo_WAR_trangthietbiyteportlet_showHide=1&_vanbancongbo_WAR_trangthietbiyteportlet_ngayGuiTu=&_vanbancongbo_WAR_trangthietbiyteportlet_ngayGuiDen=&_vanbancongbo_WAR_trangthietbiyteportlet_tenDoanhNghiep=&_vanbancongbo_WAR_trangthietbiyteportlet_coQuanQuanLyId=13515&_vanbancongbo_WAR_trangthietbiyteportlet_tthcId=0&_vanbancongbo_WAR_trangthietbiyteportlet_delta=200&_vanbancongbo_WAR_trangthietbiyteportlet_keywords=&_vanbancongbo_WAR_trangthietbiyteportlet_advancedSearch=false&_vanbancongbo_WAR_trangthietbiyteportlet_andOperator=true&_vanbancongbo_WAR_trangthietbiyteportlet_resetCur=false&_vanbancongbo_WAR_trangthietbiyteportlet_cur=${cur}`);
    await page.waitForSelector('table.oep-table');

    let urls = await page.$$eval(
      'table.oep-table > tbody > tr label > a', links => links.map(link => link.href)
    );
    
    for (let url of urls) {
      await page.goto(url);
      let html = await page.content();
      let $ = await cheerio.load(html);
      let maudon = $('body').find('.maudon');
      let tencongty = maudon.find('p:contains("1. Tên cơ sở")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let masothue = maudon.find('p:contains("Mã số thuế:")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let diachi = maudon.find('p:contains("Địa chỉ:")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let dienthoai = maudon.find('p:contains("Điện thoại:")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let nguoidaidien = maudon.find('p:contains("Họ và tên:")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let dienthoaicodinh = maudon.find('p:contains("Điện thoại cố định:")').first().find('span.text_value').first().text().replace(/\s+/g," ");
      let result = {
        tencongty,
        masothue,
        diachi,
        dienthoai,
        nguoidaidien,
        dienthoaicodinh,
        url
      };
      results.push(result);
    }

    cur += 1;
  }

  const createCsvWriter = require('csv-writer').createObjectCsvWriter;

  const csvWriter = createCsvWriter({
      path: 'data.csv',
      header: [
        {id: 'tencongty', title: 'Tên công ty'},
        {id: 'masothue', title: 'Mã số thuế'},
        {id: 'diachi', title: 'Địa chỉ'},
        {id: 'dienthoai', title: 'Số điện thoại'},
        {id: 'nguoidaidien', title: 'Người đại diện'},
        {id: 'dienthoaicodinh', title: 'Điện thoại cố định'},
        {id: 'url', title: 'Link'}
      ]
  });

  csvWriter.writeRecords(results).then(() => {
    console.log('...Done');
  });

  await browser.close();
})();