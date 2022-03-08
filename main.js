require('dotenv').config()
const puppeteer = require('puppeteer')
const fs = require('fs')

const to_skip = []

let ids = []

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const {
  AUTH_LINK,
  SIFT_SESSION,
  SESSION,
  SSID,
  UA,
} = process.env

const cookies = [
  { name: 'authlink', value: AUTH_LINK },
  { name: 'siftsession', value: SIFT_SESSION },
  { name: 'session', value: SESSION },
  { name: '__ssid', value: SSID },
  { name: 'ua', value: UA },
]

const is_full_inbox = (web_page) => web_page.evaluate(() => {
  return !!document.querySelector('.messenger-empty-state')
})

const close_cookies_popup_if_open = async (web_page) => web_page.evaluate(() => {
  const cookiesPopup = document.querySelector('button[class="save-preference-btn-handler onetrust-close-btn-handler"]')
  if (cookiesPopup) cookiesPopup.click()
})

const close_cookies_text_if_open = (web_page) => web_page.evaluate(() => {
  const cookiesText = document.querySelector('.onetrust-accept-btn-handler')
  if (cookiesText) cookiesText.click()
})

const get_ids = async (web_page) => {
  await page.goto('https://www.okcupid.com/who-you-like?cf=likesIncoming', {
    waitUntil: 'networkidle2',
  })

  await web_page.waitForSelector('.userrow-bucket-container')
  for (let i = 0; i < 50; i++) {
    await close_cookies_popup_if_open(web_page)
    await close_cookies_text_if_open(web_page)
    await web_page.type('.userrow-bucket-container', ' ')
    await sleep(250)
  }

  ids = await web_page.evaluate(() => {
    const data = document.querySelector('.userrow-bucket-container').innerHTML.match(/\/profile\/[0-9A-Za-z_.]+\?cf=likes/g)
    return data.map((e) => e.split('/')[2].split('?')[0])
  })
  return ids.length > to_skip.length
}

const send_message = async (web_page, id) => {
  await web_page.waitForSelector('.profile-pill-buttons-message-icon')

  await web_page.evaluate(() => {
    document.querySelector('.profile-pill-buttons-message-icon').parentElement.click()
  })

  await web_page.waitForSelector('.messenger')

  const full_inbox = await is_full_inbox(web_page)

  if (full_inbox) {
    to_skip.push(id)
    return
  }

  await web_page.waitForSelector('textarea[data-cy="messenger.messageInput"]')

  await web_page.evaluate(() => {
    document.querySelector('textarea[data-cy="messenger.messageInput"]').value = 'היי! מה הולך?'
  })

  await web_page.type('textarea[data-cy="messenger.messageInput"]', ' ')

  await web_page.waitForSelector('button[data-cy="messenger.sendButton"]')

  await web_page.evaluate(() => {
    document.querySelector('button[data-cy="messenger.sendButton"]').click()
  })
}

const get_insta = async (web_page, id) => {
  await web_page.waitForSelector('.profile-essay-contents')

  const possibleInstas = await web_page.evaluate(() => {
    const bio = document.querySelector('.profile-essay-contents').innerText
    if (bio === 'They haven’t written anything yet.\n\nMaybe they’re the silent type?') return
    return bio.match(/[a-zA-Z]{1}[a-zA-Z_.0-9]+/g)
  })

  if (possibleInstas) fs.appendFileSync('instas.txt', `${id}: ${possibleInstas.join(', ')}\n`)
}

let browser
let page

const init = async () => {
  browser = await puppeteer.launch({
    headless: false,
  })
  page = await browser.newPage()
  await page.goto('https://www.okcupid.com', {
    waitUntil: 'networkidle2',
  })
  await page.setCookie(...cookies)
}

const main = async () => {
  await init()
  let counter = 0

  let more_to_find = true

  while (more_to_find) {
    while (ids.length) {
      const id = ids.pop()

      if (to_skip.includes(id)) continue

      try {
        await page.goto(`https://www.okcupid.com/profile/${id}?cf=likes`, {
          waitUntil: 'networkidle2',
        })
        await get_insta(page, id)
        await send_message(page, id)
      } catch (e) {
        console.log(e)
        to_skip.push(id)
        await browser.close()
        await init()
      }

      console.log(`done: ${counter}, remaining: ${ids.length}`)
      console.log(`id: ${id}`)
      counter++
    }
    try {
      more_to_find = await get_ids(page)
    } catch (e) {
      console.log(e)
      more_to_find = false
    }
    console.log(ids)
  }

  await browser.close()
}

main()
