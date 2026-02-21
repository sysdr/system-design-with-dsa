FROM alpine:latest
WORKDIR /app
COPY stream_processor.c .
RUN apk add --no-cache gcc libc-dev
RUN gcc -o stream_processor stream_processor.c
CMD ["./stream_processor"]
