FROM docker:27.3.1-cli

RUN apk add --no-cache bash git curl jq

COPY release-watcher.sh /usr/local/bin/release-watcher
RUN chmod +x /usr/local/bin/release-watcher

ENTRYPOINT ["release-watcher"]
