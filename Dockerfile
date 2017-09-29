FROM voidlinux/voidlinux-musl
RUN xbps-install -Syu
RUN xbps-install -Sy nodejs make gcc curl
RUN curl -o- -L https://yarnpkg.com/install.sh | bash
ENV PATH="/root/.yarn/bin:$PATH"
RUN yarn global add mocha nyc jshint
