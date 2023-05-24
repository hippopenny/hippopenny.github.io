Hippo Penny

Building your site locally
Open Terminal.

Navigate to the publishing source for your site. For more information, see "Configuring a publishing source for your GitHub Pages site."

Run bundle install

Run your Jekyll site locally.

$ bundle exec jekyll serve
> Configuration file: /Users/octocat/my-site/_config.yml
>            Source: /Users/octocat/my-site
>       Destination: /Users/octocat/my-site/_site
> Incremental build: disabled. Enable with --incremental
>      Generating...
>                    done in 0.309 seconds.
> Auto-regeneration: enabled for '/Users/octocat/my-site'
> Configuration file: /Users/octocat/my-site/_config.yml
>    Server address: http://127.0.0.1:4000/
>  Server running... press ctrl-c to stop.

If you have ruby >= 3.0, bundle add webrick


Page Paths: are defined by tag `permalink:` inside _pages/x.md. For example, index page is `home.md` because we set permalink: / in file _pages/home.md. A post will be shown in time order, and there is no permalink in its meta.

Pages: are configured under _data/navigation.yml

Embed any videos:
https://github.com/nathancy/jekyll-embed-video/blob/master/example.md


## Build and Deploy Github Page

Configure github action at https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site 

