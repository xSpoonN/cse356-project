FROM fluentd

COPY ./fluent.conf /fluentd/etc/

USER root
RUN mkdir -p /var/log/fluentd
RUN chown -R fluent /var/log/fluentd

USER fluent