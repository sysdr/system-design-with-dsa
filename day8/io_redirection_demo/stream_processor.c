#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h> // For isspace

void trim_whitespace(char *str) {
    int i;
    int start = 0;
    int end = strlen(str) - 1;

    // Trim leading whitespace
    while (isspace((unsigned char)str[start])) {
        start++;
    }

    // Trim trailing whitespace
    while (end >= start && isspace((unsigned char)str[end])) {
        end--;
    }

    // Shift non-whitespace characters to the beginning
    for (i = start; i <= end; i++) {
        str[i - start] = str[i];
    }
    str[i - start] = '\0'; // Null-terminate
}

int main() {
    char line[256];
    time_t rawtime;
    struct tm *info;
    char timestamp[80];

    while (fgets(line, sizeof(line), stdin) != NULL) {
        // Remove trailing newline character if present
        line[strcspn(line, "\n")] = 0;

        char trimmed_line[256];
        strcpy(trimmed_line, line);
        trim_whitespace(trimmed_line);

        if (strlen(trimmed_line) == 0) {
            fprintf(stderr, "ERROR: Empty or whitespace-only line received.n");
        } else {
            time(&rawtime);
            info = localtime(&rawtime);
            strftime(timestamp, 80, "[%Y-%m-%d %H:%M:%S] ", info);
            fprintf(stdout, "%s%sn", timestamp, line);
        }
    }
    return 0;
}
